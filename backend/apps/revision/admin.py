from django.urls import reverse, path
from django.utils.html import format_html, escape
from django.db.models import Count, Q, Sum, Avg
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.http import HttpResponse, JsonResponse
from django.template.response import TemplateResponse
from django.shortcuts import redirect, get_object_or_404
from django.contrib import messages
from django.db import transaction
from django.contrib.admin import SimpleListFilter
from django.contrib.admin.views.main import ChangeList
from django.contrib import admin
import csv
import datetime
import logging

logger = logging.getLogger(__name__)

from .models import (
    FlashcardDeck,
    Flashcard,
)

from django.conf import settings


# Custom Filters
class DueForReviewFilter(SimpleListFilter):
    title = _('Due for review')
    parameter_name = 'due_for_review'

    def lookups(self, request, model_admin):
        return (
            ('today', _('Due today')),
            ('tomorrow', _('Due tomorrow')),
            ('this_week', _('Due this week')),
            ('overdue', _('Overdue')),
        )

    def queryset(self, request, queryset):
        now = timezone.now()
        tomorrow = now + datetime.timedelta(days=1)
        next_week = now + datetime.timedelta(days=7)
        
        if self.value() == 'today':
            return queryset.filter(next_review__date=now.date())
        if self.value() == 'tomorrow':
            return queryset.filter(next_review__date=tomorrow.date())
        if self.value() == 'this_week':
            return queryset.filter(next_review__date__gte=now.date(), next_review__date__lte=next_week.date())
        if self.value() == 'overdue':
            return queryset.filter(next_review__lt=now, learned=True)
        return queryset


class ProgressFilter(SimpleListFilter):
    title = _('Learning Progress')
    parameter_name = 'progress'

    def lookups(self, request, model_admin):
        return (
            ('not_started', _('Not started')),
            ('in_progress', _('In progress')),
            ('learned', _('Learned')),
        )

    def queryset(self, request, queryset):
        if self.value() == 'not_started':
            return queryset.filter(review_count=0)
        if self.value() == 'in_progress':
            return queryset.filter(review_count__gt=0, learned=False)
        if self.value() == 'learned':
            return queryset.filter(learned=True)
        return queryset


class FlashcardInline(admin.TabularInline):
    model = Flashcard
    fields = ('front_text', 'back_text', 'learned', 'review_count', 'next_review')
    readonly_fields = ('review_count', 'next_review')
    extra = 1
    max_num = 20
    can_delete = True
    show_change_link = True
    classes = ('collapse',)
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('deck', 'user')


@admin.register(FlashcardDeck)
class FlashcardDeckAdmin(admin.ModelAdmin):
    list_display = ('name', 'user_link', 'description_truncated', 'card_count', 'completion_rate', 'created_at', 'is_active')
    list_filter = ('is_active', 'created_at', 'user')
    search_fields = ('name', 'description', 'user__username', 'user__email')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'card_count', 'completion_rate', 'deck_statistics', 'last_review_date')
    fieldsets = (
        (None, {
            'fields': ('user', 'name', 'description', 'is_active')
        }),
        (_('Timestamps'), {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
        (_('Statistics'), {
            'fields': ('card_count', 'completion_rate', 'deck_statistics', 'last_review_date'),
        }),
    )
    inlines = [FlashcardInline]
    actions = [
        'activate_decks', 
        'deactivate_decks', 
        'export_as_csv', 
        'mark_all_as_learned',
        'reset_all_cards',
        'duplicate_decks',
    ]
    save_on_top = True
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                '<int:deck_id>/study/',
                self.admin_site.admin_view(self.study_view),
                name='revision_flashcarddeck_study',
            ),
            path(
                '<int:deck_id>/analytics/',
                self.admin_site.admin_view(self.analytics_view),
                name='revision_flashcarddeck_analytics',
            ),
            path(
                'import-csv/',
                self.admin_site.admin_view(self.import_csv_view),
                name='revision_flashcarddeck_import_csv',
            ),
        ]
        return custom_urls + urls

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        queryset = queryset.annotate(
            card_count=Count('flashcards'),
            learned_count=Count('flashcards', filter=Q(flashcards__learned=True))
        )
        return queryset

    def card_count(self, obj):
        return obj.card_count
    card_count.short_description = _('Cards')
    card_count.admin_order_field = 'card_count'
    
    def completion_rate(self, obj):
        if obj.card_count == 0:
            return '0%'
        completion = (obj.learned_count / obj.card_count) * 100
        color = 'red'
        if completion >= 75:
            color = 'green'
        elif completion >= 50:
            color = 'orange'
        elif completion >= 25:
            color = 'yellow'
        # Utiliser round() plutôt que le formatage à l'intérieur de format_html
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}%</span>',
            color, round(completion, 1)
        )
    completion_rate.short_description = _('Completion Rate')
    
    def last_review_date(self, obj):
        last_reviewed = obj.flashcards.filter(last_reviewed__isnull=False).order_by('-last_reviewed').first()
        if last_reviewed:
            days_ago = (timezone.now() - last_reviewed.last_reviewed).days
            return format_html(
                '{} <span style="color: gray;">({} days ago)</span>',
                last_reviewed.last_reviewed.strftime('%Y-%m-%d'),
                days_ago
            )
        return _('Never reviewed')
    last_review_date.short_description = _('Last review')
    
    def deck_statistics(self, obj):
        cards = obj.flashcards.all()
        if not cards:
            return _('No cards in this deck')
            
        total = cards.count()
        learned = cards.filter(learned=True).count()
        not_learned = total - learned
        due_today = cards.filter(next_review__date=timezone.now().date()).count()
        overdue = cards.filter(next_review__lt=timezone.now()).count()
        
        learned_pct = (learned / total * 100) if total else 0
        not_learned_pct = (not_learned / total * 100) if total else 0
        
        return format_html(
            """
            <div style="margin-bottom: 10px;">
                <div style="margin-bottom: 5px;">
                    <strong style="color: green;">✓ Learned:</strong> {} ({}%)
                </div>
                <div style="margin-bottom: 5px;">
                    <strong style="color: red;">✗ Not learned:</strong> {} ({}%)
                </div>
                <div style="margin-bottom: 5px;">
                    <strong style="color: blue;">⏰ Due today:</strong> {}
                </div>
                <div style="margin-bottom: 5px;">
                    <strong style="color: orange;">⚠ Overdue:</strong> {}
                </div>
                <div style="margin-top: 10px;">
                    <a href="{}" class="button">Study Now</a> 
                    <a href="{}" class="button">Analytics</a>
                </div>
            </div>
            """,
            learned, 
            round(learned_pct, 1),
            not_learned, 
            round(not_learned_pct, 1),
            due_today,
            overdue,
            reverse('admin:revision_flashcarddeck_study', args=[obj.pk]),
            reverse('admin:revision_flashcarddeck_analytics', args=[obj.pk]),
        )
    deck_statistics.short_description = _('Deck statistics')

    def description_truncated(self, obj):
        if len(obj.description) > 50:
            return f"{obj.description[:50]}..."
        return obj.description
    description_truncated.short_description = _('Description')

    def user_link(self, obj):
        url = reverse('admin:authentication_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, escape(obj.user.username))
    user_link.short_description = _('User')
    user_link.admin_order_field = 'user__username'

    def activate_decks(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, _(f'{updated} decks have been activated.'))
    activate_decks.short_description = _('Mark selected decks as active')

    def deactivate_decks(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, _(f'{updated} decks have been deactivated.'))
    deactivate_decks.short_description = _('Mark selected decks as inactive')
    
    def export_as_csv(self, request, queryset):
        meta = self.model._meta
        field_names = ['name', 'description', 'user__username', 'created_at']
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename={meta.verbose_name_plural}.csv'
        writer = csv.writer(response)
        
        writer.writerow([meta.get_field(field).verbose_name for field in field_names])
        for obj in queryset:
            writer.writerow([getattr(obj, field) if '__' not in field else getattr(getattr(obj, field.split('__')[0]), field.split('__')[1]) for field in field_names])
            
            # Add cards for this deck
            writer.writerow(['Front', 'Back', 'Learned', 'Review Count'])
            for card in obj.flashcards.all():
                writer.writerow([card.front_text, card.back_text, card.learned, card.review_count])
            writer.writerow([])  # Empty row between decks
            
        return response
    export_as_csv.short_description = _('Export selected decks to CSV')
    
    def mark_all_as_learned(self, request, queryset):
        count = 0
        for deck in queryset:
            updated = deck.flashcards.update(learned=True)
            count += updated
        self.message_user(request, _(f'{count} cards marked as learned across {queryset.count()} decks.'))
    mark_all_as_learned.short_description = _('Mark all cards in selected decks as learned')
    
    def reset_all_cards(self, request, queryset):
        count = 0
        for deck in queryset:
            for card in deck.flashcards.all():
                card.reset_progress()
                count += 1
        self.message_user(request, _(f'Progress reset for {count} cards across {queryset.count()} decks.'))
    reset_all_cards.short_description = _('Reset progress for all cards in selected decks')
    
    def duplicate_decks(self, request, queryset):
        for deck in queryset:
            # Create new deck
            new_deck = FlashcardDeck.objects.create(
                user=deck.user,
                name=f"Copy of {deck.name}",
                description=deck.description,
                is_active=True
            )
            
            # Copy all cards
            for card in deck.flashcards.all():
                Flashcard.objects.create(
                    user=card.user,
                    deck=new_deck,
                    front_text=card.front_text,
                    back_text=card.back_text,
                    learned=False,
                    review_count=0,
                    last_reviewed=None,
                    next_review=None
                )
        
        self.message_user(request, _(f'{queryset.count()} decks duplicated.'))
    duplicate_decks.short_description = _('Duplicate selected decks')
    
    def study_view(self, request, deck_id):
        """Study view for reviewing cards in a deck"""
        deck = self.get_object(request, deck_id)
        if not deck:
            messages.error(request, _("Deck not found."))
            return redirect('admin:revision_flashcarddeck_changelist')
            
        # Get cards due for review, or cards not learned
        now = timezone.now()
        cards_due = list(deck.flashcards.filter(Q(next_review__lte=now) | Q(learned=False)).order_by('learned', 'review_count', 'last_reviewed'))
        
        context = dict(
            self.admin_site.each_context(request),
            title=_("Study: %s" % deck.name),
            deck=deck,
            cards=cards_due,
            cards_count=len(cards_due),
            app_label=self.model._meta.app_label,
            opts=self.model._meta,
        )
        
        return TemplateResponse(request, 'admin/revision/flashcarddeck/study.html', context)
    
    def analytics_view(self, request, deck_id):
        """Analytics view to see statistics for a deck"""
        deck = self.get_object(request, deck_id)
        if not deck:
            messages.error(request, _("Deck not found."))
            return redirect('admin:revision_flashcarddeck_changelist')
        
        # Calculate statistics
        total_cards = deck.flashcards.count()
        learned_cards = deck.flashcards.filter(learned=True).count()
        not_learned = total_cards - learned_cards
        
        # Review distribution
        review_0 = deck.flashcards.filter(review_count=0).count()
        review_1_3 = deck.flashcards.filter(review_count__gte=1, review_count__lte=3).count()
        review_4_plus = deck.flashcards.filter(review_count__gte=4).count()
        
        # Cards per day
        today = timezone.now().date()
        cards_per_day = []
        for i in range(7):
            day = today + datetime.timedelta(days=i)
            count = deck.flashcards.filter(next_review__date=day).count()
            cards_per_day.append({
                'day': day.strftime('%Y-%m-%d'),
                'count': count,
                'day_name': day.strftime('%A')
            })
        
        context = dict(
            self.admin_site.each_context(request),
            title=_("Analytics: %s" % deck.name),
            deck=deck,
            total_cards=total_cards,
            learned_cards=learned_cards,
            not_learned=not_learned,
            review_0=review_0,
            review_1_3=review_1_3,
            review_4_plus=review_4_plus,
            cards_per_day=cards_per_day,
            completion_rate=round((learned_cards / total_cards * 100) if total_cards else 0, 1),
            app_label=self.model._meta.app_label,
            opts=self.model._meta,
        )
        
        return TemplateResponse(request, 'admin/revision/flashcarddeck/analytics.html', context)
    
    def import_csv_view(self, request):
        """View for importing cards from a CSV"""
        context = dict(
            self.admin_site.each_context(request),
            title=_("Import Flashcards from CSV"),
            app_label=self.model._meta.app_label,
            opts=self.model._meta,
        )
        
        if request.method == 'POST' and request.FILES.get('csv_file'):
            csv_file = request.FILES['csv_file']
            deck_id = request.POST.get('deck')
            user_id = request.POST.get('user')
            create_new = request.POST.get('create_new') == 'on'
            new_deck_name = request.POST.get('new_deck_name')
            
            try:
                # Validate inputs
                if create_new and not new_deck_name:
                    messages.error(request, _("Please provide a name for the new deck."))
                    return TemplateResponse(request, 'admin/revision/flashcarddeck/import_csv.html', context)
                
                if not create_new and not deck_id:
                    messages.error(request, _("Please select an existing deck."))
                    return TemplateResponse(request, 'admin/revision/flashcarddeck/import_csv.html', context)
                
                if not user_id:
                    messages.error(request, _("Please select a user."))
                    return TemplateResponse(request, 'admin/revision/flashcarddeck/import_csv.html', context)
                
                # Create or get the deck
                if create_new:
                    deck = FlashcardDeck.objects.create(
                        user_id=user_id,
                        name=new_deck_name,
                        description=request.POST.get('new_deck_description', ''),
                        is_active=True
                    )
                else:
                    deck = FlashcardDeck.objects.get(id=deck_id)
                
                # Read the CSV
                decoded_file = csv_file.read().decode('utf-8').splitlines()
                reader = csv.reader(decoded_file)
                next(reader)  # Skip header row
                
                cards_created = 0
                with transaction.atomic():
                    for row in reader:
                        if len(row) >= 2:  # At least front and back
                            front, back = row[0], row[1]
                            if front and back:  # Don't create empty cards
                                Flashcard.objects.create(
                                    user_id=user_id,
                                    deck=deck,
                                    front_text=front,
                                    back_text=back,
                                    learned=False
                                )
                                cards_created += 1
                
                messages.success(request, _(f"{cards_created} flashcards imported successfully to deck '{deck.name}'."))
                return redirect('admin:revision_flashcarddeck_change', deck.id)
                
            except Exception as e:
                messages.error(request, _(f"Error importing data: {str(e)}"))
        
        # Pass available decks and users to the template
        context['decks'] = FlashcardDeck.objects.all()
        from django.contrib.auth import get_user_model
        context['users'] = get_user_model().objects.all()
        
        return TemplateResponse(request, 'admin/revision/flashcarddeck/import_csv.html', context)

class FlashcardChangeList(ChangeList):
    def get_results(self, *args, **kwargs):
        super().get_results(*args, **kwargs)
        # Add statistics to the changelist
        queryset = self.queryset
        self.learned_count = queryset.filter(learned=True).count()
        self.total_count = queryset.count()
        self.cards_due_today = queryset.filter(next_review__date=timezone.now().date()).count()
        self.total_reviews = queryset.aggregate(total=Sum('review_count'))['total'] or 0
        self.avg_reviews = round(self.total_reviews / self.total_count, 1) if self.total_count else 0

    def completion_rate(self, obj):
        if obj.card_count == 0:
            return '0%'
        completion = (obj.learned_count / obj.card_count) * 100
        color = 'red'
        if completion >= 75:
            color = 'green'
        elif completion >= 50:
            color = 'orange'
        elif completion >= 25:
            color = 'yellow'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{:.1f}%</span>',
            color, float(completion)  # Convertir explicitement en float
        )
@admin.register(Flashcard)
class FlashcardAdmin(admin.ModelAdmin):
    list_display = ('front_preview', 'back_preview', 'deck_link', 'user_link', 'learned_status', 'review_count', 'next_review_date', 'learning_progress')
    list_filter = (DueForReviewFilter, ProgressFilter, 'learned', 'deck', 'created_at', 'last_reviewed', 'user')
    search_fields = ('front_text', 'back_text', 'deck__name', 'user__username')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'last_reviewed', 'review_count', 'next_review', 'progress_chart')
    fieldsets = (
        (None, {
            'fields': ('user', 'deck', 'front_text', 'back_text', 'learned')
        }),
        (_('Review Information'), {
            'fields': ('review_count', 'last_reviewed', 'next_review', 'progress_chart'),
        }),
        (_('Timestamps'), {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    actions = [
        'mark_as_learned', 
        'mark_as_not_learned', 
        'reset_review_progress',
        'schedule_for_today',
        'schedule_for_tomorrow',
        'schedule_for_week',
        'export_selected_to_csv',
        'schedule_custom',
    ]
    list_per_page = 25
    save_on_top = True
    
    def get_changelist(self, request, **kwargs):
        return FlashcardChangeList

    class Media:
        css = {
            'all': ('css/admin/flashcard.css',)
        }
        js = ('js/admin/flashcard_review.js',)
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('deck', 'user')
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                'schedule-custom/',
                self.admin_site.admin_view(self.schedule_custom_view),
                name='revision_flashcard_schedule_custom',
            ),
            path(
                'review/<int:flashcard_id>/',
                self.admin_site.admin_view(self.review_card_view),
                name='revision_flashcard_review',
            ),
        ]
        return custom_urls + urls

    def front_preview(self, obj):
        text = obj.front_text[:40] + ('...' if len(obj.front_text) > 40 else '')
        return format_html(
            '<a href="{}">{}</a>',
            reverse('admin:revision_flashcard_review', args=[obj.id]),
            text
        )
    front_preview.short_description = _('Front')
    
    def back_preview(self, obj):
        text = obj.back_text[:40] + ('...' if len(obj.back_text) > 40 else '')
        return text
    back_preview.short_description = _('Back')

    def deck_link(self, obj):
        url = reverse('admin:revision_flashcarddeck_change', args=[obj.deck.id])
        return format_html('<a href="{}">{}</a>', url, escape(obj.deck.name))
    deck_link.short_description = _('Deck')
    deck_link.admin_order_field = 'deck__name'

    def user_link(self, obj):
        url = reverse('admin:authentication_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, escape(obj.user.username))
    user_link.short_description = _('User')
    user_link.admin_order_field = 'user__username'

    def learned_status(self, obj):
        if obj.learned:
            return format_html('<span style="color: green; font-weight: bold;">✓</span>')
        return format_html('<span style="color: red; font-weight: bold;">✗</span>')
    learned_status.short_description = _('Learned')
    learned_status.admin_order_field = 'learned'

    def next_review_date(self, obj):
        if obj.next_review:
            now = timezone.now()
            days_diff = (obj.next_review.date() - now.date()).days
            
            if days_diff < 0:
                return format_html(
                    '<span style="color: red; font-weight: bold;">{} (Overdue by {} days)</span>',
                    obj.next_review.strftime('%Y-%m-%d'),
                    abs(days_diff)
                )
            elif days_diff == 0:
                return format_html(
                    '<span style="color: green; font-weight: bold;">{} (Today)</span>',
                    obj.next_review.strftime('%Y-%m-%d')
                )
            elif days_diff == 1:
                return format_html(
                    '<span style="color: blue;">{} (Tomorrow)</span>',
                    obj.next_review.strftime('%Y-%m-%d')
                )
            else:
                return format_html(
                    '{} (In {} days)',
                    obj.next_review.strftime('%Y-%m-%d'),
                    days_diff
                )
        return '—'
    next_review_date.short_description = _('Next Review')
    next_review_date.admin_order_field = 'next_review'
    
    def learning_progress(self, obj):
        # Display a progress bar based on the number of reviews
        review_count = obj.review_count or 0
        
        if obj.learned:
            color = "green"
            percentage = 100
            text = "Learned"
        else:
            if review_count == 0:
                color = "red"
                percentage = 0
                text = "New"
            else:
                color = "orange"
                percentage = min(review_count * 20, 80)  # Max 80% until learned
                text = f"{review_count} reviews"
        
        return format_html(
            '''
            <div style="width: 100px; height: 15px; background-color: #f0f0f0; border-radius: 3px; overflow: hidden;">
                <div style="width: {}%; height: 100%; background-color: {}; text-align: center;"></div>
            </div>
            <span style="font-size: 0.8em;">{}</span>
            ''',
            percentage, color, text
        )
    learning_progress.short_description = _('Progress')
    
    def progress_chart(self, obj):
        if not obj.last_reviewed:
            return _("No review data available")
        
        # Create a basic chart with stars to show progress
        chart = ""
        for i in range(1, 6):
            if i <= obj.review_count:
                chart += "★ "
            else:
                chart += "☆ "
        
        return format_html(
            '''
            <div style="margin-bottom: 20px;">
                <strong>Reviews progression:</strong> 
                <span style="font-size: 1.5em; color: green;">{}</span>
            </div>
            <div>
                <a href="{}" class="button">Review Now</a>
            </div>
            ''',
            chart,
            reverse('admin:revision_flashcard_review', args=[obj.pk])
        )
    progress_chart.short_description = _('Learning Progress')

    def mark_as_learned(self, request, queryset):
        queryset.update(learned=True)
        self.message_user(request, _(f'{queryset.count()} flashcards marked as learned.'))
    mark_as_learned.short_description = _('Mark selected flashcards as learned')

    def mark_as_not_learned(self, request, queryset):
        queryset.update(learned=False)
        self.message_user(request, _(f'{queryset.count()} flashcards marked as not learned.'))
    mark_as_not_learned.short_description = _('Mark selected flashcards as not learned')

    def reset_review_progress(self, request, queryset):
        for flashcard in queryset:
            flashcard.reset_progress()
        self.message_user(request, _(f'Review progress reset for {queryset.count()} flashcards.'))
    reset_review_progress.short_description = _('Reset review progress for selected flashcards')
    
    def schedule_for_today(self, request, queryset):
        queryset.update(next_review=timezone.now())
        self.message_user(request, _(f'{queryset.count()} flashcards scheduled for review today.'))
    schedule_for_today.short_description = _('Schedule selected flashcards for today')
    
    def schedule_for_tomorrow(self, request, queryset):
        next_day = timezone.now() + datetime.timedelta(days=1)
        queryset.update(next_review=next_day)
        self.message_user(request, _(f'{queryset.count()} flashcards scheduled for review tomorrow.'))
    schedule_for_tomorrow.short_description = _('Schedule selected flashcards for tomorrow')
    
    def schedule_for_week(self, request, queryset):
        # Spread cards throughout the week
        cards = list(queryset)
        cards_per_day = len(cards) // 7 or 1
        
        for i, card in enumerate(cards):
            days_to_add = i // cards_per_day if i // cards_per_day < 7 else 6
            card.next_review = timezone.now() + datetime.timedelta(days=days_to_add)
            card.save()
            
        self.message_user(request, _(f'{queryset.count()} flashcards scheduled over the next week.'))
    schedule_for_week.short_description = _('Distribute selected flashcards over the next week')
    
    def export_selected_to_csv(self, request, queryset):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="flashcards.csv"'
        writer = csv.writer(response)
        
        # Write header
        writer.writerow(['Deck', 'Front', 'Back', 'Learned', 'Review Count', 'Last Reviewed', 'Next Review'])
        
        # Write data
        for card in queryset:
            writer.writerow([
                card.deck.name,
                card.front_text,
                card.back_text,
                'Yes' if card.learned else 'No',
                card.review_count,
                card.last_reviewed.strftime('%Y-%m-%d') if card.last_reviewed else '',
                card.next_review.strftime('%Y-%m-%d') if card.next_review else ''
            ])
            
        return response
    export_selected_to_csv.short_description = _('Export selected flashcards to CSV')
    
    def schedule_custom_view(self, request):
        """View for custom review scheduling"""
        selected = request.POST.getlist('_selected_action')
        
        if not selected:
            messages.error(request, _("No flashcards selected."))
            return redirect('admin:revision_flashcard_changelist')
            
        if request.method == 'POST' and '_schedule' in request.POST:
            try:
                days = int(request.POST.get('days', 0))
                date_str = request.POST.get('specific_date')
                
                if date_str:
                    date_obj = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
                    target_date = timezone.make_aware(datetime.datetime.combine(date_obj, datetime.time.min))
                else:
                    target_date = timezone.now() + datetime.timedelta(days=days)
                
                queryset = self.model.objects.filter(pk__in=selected)
                queryset.update(next_review=target_date)
                
                self.message_user(request, _(f'{queryset.count()} flashcards scheduled for {target_date.strftime("%Y-%m-%d")}.'))
                return redirect('admin:revision_flashcard_changelist')
            except ValueError:
                messages.error(request, _("Invalid date format."))
        
        context = dict(
            self.admin_site.each_context(request),
            title=_("Schedule Custom Review"),
            selected=selected,
            action='schedule_custom',
            opts=self.model._meta,
            app_label=self.model._meta.app_label,
        )
        
        return TemplateResponse(request, 'admin/revision/flashcard/schedule_custom.html', context)
    
    def schedule_custom(self, request, queryset):
        return redirect('admin:revision_flashcard_schedule_custom')
    schedule_custom.short_description = _('Schedule selected cards for custom date')
    
    def review_card_view(self, request, flashcard_id):
        """View for reviewing an individual card"""
        flashcard = self.get_object(request, flashcard_id)
        if not flashcard:
            messages.error(request, _("Flashcard not found."))
            return redirect('admin:revision_flashcard_changelist')
            
        if request.method == 'POST':
            success = request.POST.get('success') == 'true'
            flashcard.mark_reviewed(success=success)
            
            next_card = None
            # Find another card to review from the same deck
            if success:
                messages.success(request, _("Card marked as successfully reviewed!"))
                next_card = Flashcard.objects.filter(
                    deck=flashcard.deck,
                    next_review__lte=timezone.now(),
                    id__ne=flashcard.id
                ).first()
            else:
                messages.info(request, _("Card will be shown again soon."))
                
            if next_card:
                return redirect('admin:revision_flashcard_review', next_card.id)
            else:
                return redirect('admin:revision_flashcarddeck_change', flashcard.deck.id)
            
        # Get next and previous cards in the same deck for navigation
        next_card = Flashcard.objects.filter(
            deck=flashcard.deck,
            next_review__lte=timezone.now(),
            id__gt=flashcard.id
        ).order_by('id').first()
        
        prev_card = Flashcard.objects.filter(
            deck=flashcard.deck,
            id__lt=flashcard.id
        ).order_by('-id').first()
            
        context = dict(
            self.admin_site.each_context(request),
            title=_("Review Card"),
            flashcard=flashcard,
            next_card=next_card,
            prev_card=prev_card,
            opts=self.model._meta,
            app_label=self.model._meta.app_label,
        )
        
        return TemplateResponse(request, 'admin/revision/flashcard/review_card.html', context)