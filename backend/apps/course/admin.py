# course/admin.py
from django.contrib import admin
from django.utils.html import format_html, mark_safe
from django import forms
from django.urls import path, reverse
from django.shortcuts import redirect, render, get_object_or_404
from django.contrib import messages
from django.http import HttpResponse, JsonResponse, HttpResponseRedirect
from django.template.response import TemplateResponse
from django.core.serializers.json import DjangoJSONEncoder
import csv, io, json

from .widgets import AdminJSONFormField
from .models import (
    Unit, 
    Lesson, 
    ContentLesson, 
    TheoryContent,
    VocabularyList, 
    ExerciseVocabularyMultipleChoice, 
    MultipleChoiceQuestion, 
    Numbers,
    MatchingExercise,
    ExerciseGrammarReordering,
    FillBlankExercise,
    SpeakingExercise
)

class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 0
    show_change_link = True
    fields = ('title_en', 'lesson_type', 'estimated_duration', 'order')
    ordering = ('order',)

@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_title', 'level', 'order', 'lesson_count')
    list_filter = ('level', )
    search_fields = ('title_en', 'title_fr', 'title_es', 'title_nl')
    ordering = ('order', 'id')
    inlines = [LessonInline]
    
    def get_title(self, obj):
        return f"{obj.title_en} | {obj.title_fr}"
    get_title.short_description = 'Title'
    
    def lesson_count(self, obj):
        count = obj.lessons.count()
        return format_html('<span style="color: {};">{}</span>', 
                          'green' if count > 0 else 'red', 
                          f"{count} lessons")
    lesson_count.short_description = 'Lessons'

class ContentLessonInline(admin.TabularInline):
    model = ContentLesson
    extra = 0
    show_change_link = True
    fields = ('title_en', 'content_type', 'order')
    ordering = ('order',)


@admin.register(ContentLesson)
class ContentLessonAdmin(admin.ModelAdmin):
    list_display = ('id', 'title_en', 'content_type', 'lesson', 'order', 'estimated_duration')
    list_filter = ('content_type', 'lesson__unit', 'lesson__lesson_type')
    search_fields = ('title_en', 'title_fr', 'instruction_en')
    ordering = ('lesson', 'order')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('lesson', 'content_type', 'order', 'estimated_duration')
        }),
        ('Titles', {
            'fields': ('title_en', 'title_fr', 'title_es', 'title_nl')
        }),
        ('Instructions', {
            'fields': ('instruction_en', 'instruction_fr', 'instruction_es', 'instruction_nl')
        }),
    )


class LessonAdminForm(forms.ModelForm):
    class Meta:
        model = Lesson
        fields = '__all__'
        
    def clean(self):
        cleaned_data = super().clean()
        lesson_type = cleaned_data.get('lesson_type')
        professional_field = cleaned_data.get('professional_field')
        
        if lesson_type == 'professional' and not professional_field:
            self.add_error('professional_field', 'Ce champ est obligatoire pour les leçons professionnelles.')
        
        return cleaned_data


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    form = LessonAdminForm  # Utilise notre formulaire personnalisé
    list_display = ('id', 'get_title', 'unit', 'lesson_type', 'get_professional_field', 'estimated_duration', 'order', 'content_count')
    list_filter = ('lesson_type', 'unit', 'professional_field')
    search_fields = ('title_en', 'title_fr', 'description_en')
    ordering = ('unit', 'order')
    inlines = [ContentLessonInline]
    
    def get_title(self, obj):
        return f"{obj.title_en} | {obj.title_fr}"
    get_title.short_description = 'Title'
    
    def get_professional_field(self, obj):
        if obj.lesson_type == 'professional' and obj.professional_field:
            return obj.professional_field
        return "-"
    get_professional_field.short_description = 'Professional Field'
    
    def get_fieldsets(self, request, obj=None):
        """Personnalisation dynamique des fieldsets selon le type de leçon"""
        fieldsets = [
            ('Basic Information', {
                'fields': ('unit', 'lesson_type',)  # Notez que professional_field n'est PAS ici
            }),
            ('Professional Information', {
                'fields': ('professional_field',),
                'classes': ('professional-settings',),
                'description': 'Ces champs ne sont pertinents que pour les leçons de type professionnel.'
            }),
            ('Titles', {
                'fields': ('title_en', 'title_fr', 'title_es', 'title_nl')
            }),
            ('Descriptions', {
                'fields': ('description_en', 'description_fr', 'description_es', 'description_nl')
            }),
            ('Other', {
                'fields': ('order', 'estimated_duration')
            })
        ]
        
        return fieldsets
    
    def get_changeform_initial_data(self, request):
        """Préremplit le type de leçon à partir des paramètres GET"""
        initial = super().get_changeform_initial_data(request)
        if 'lesson_type' in request.GET:
            initial['lesson_type'] = request.GET.get('lesson_type')
        return initial
    
    class Media:
        js = ('js/lesson_admin.js',)
        css = {
            'all': ('css/lesson_admin.css',)
        }
    
    def content_count(self, obj):
        count = obj.content_lessons.count()
        return format_html('<span class="badge {}">{} contents</span>', 
                        'badge-success' if count > 0 else 'badge-danger', 
                        count)
    content_count.short_description = 'Contents'


class VocabularyInline(admin.TabularInline):
    model = SpeakingExercise.vocabulary_items.through
    verbose_name = "Vocabulary Item"
    verbose_name_plural = "Vocabulary Items"
    extra = 1
    autocomplete_fields = ['vocabularylist']


@admin.register(SpeakingExercise)
class SpeakingExerciseAdmin(admin.ModelAdmin):
    list_display = ['id', 'content_lesson_info', 'vocabulary_count', 'content_lesson_id']
    list_filter = ['content_lesson__lesson__unit__level']
    search_fields = ['content_lesson__title_en']

    fieldsets = [
        (None, {
            'fields': ['content_lesson']
        }),
    ]
    inlines = [VocabularyInline]
    exclude = ['vocabulary_items']  # Exclu car géré par l'inline
    
    def exercise_title(self, obj):
        return obj.title_en
    exercise_title.short_description = "Title"
    
    def content_lesson_info(self, obj):
        unit_info = obj.content_lesson.lesson.unit.title_en
        lesson_info = obj.content_lesson.lesson.title_en
        return format_html(
            "<strong>Unit:</strong> {} <br/><strong>Lesson:</strong> {}",
            unit_info, lesson_info
        )
    content_lesson_info.short_description = "Lesson Info"
    
    def vocabulary_count(self, obj):
        count = obj.vocabulary_items.count()
        return format_html(
            '<span style="color:{}">{} items</span>',
            'green' if count > 0 else 'red',
            count
        )
    vocabulary_count.short_description = "Vocabulary"
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'content_lesson__lesson__unit'
        ).prefetch_related('vocabulary_items')

    actions = ['associate_vocabulary_from_lesson']
    
    def associate_vocabulary_from_lesson(self, request, queryset):
        """Action qui associe automatiquement tous les mots de vocabulaire pertinents aux exercices sélectionnés"""
        total_exercises = queryset.count()
        exercises_updated = 0
        words_added = 0
        
        for exercise in queryset:
            content_lesson = exercise.content_lesson
            parent_lesson = content_lesson.lesson
            
            # Mémoriser le nombre de mots avant l'opération
            words_before = exercise.vocabulary_items.count()
            
            # 1. Essayer de trouver des mots dans la même content_lesson
            vocab_items = VocabularyList.objects.filter(content_lesson=content_lesson)
            
            # 2. Si aucun mot, chercher dans les content_lessons de type vocabulaire dans la même lesson
            if not vocab_items.exists():
                vocab_lessons = ContentLesson.objects.filter(
                    lesson=parent_lesson,
                    content_type__iexact='vocabulary'
                )
                
                for vocab_lesson in vocab_lessons:
                    lesson_vocab = VocabularyList.objects.filter(content_lesson=vocab_lesson)
                    vocab_items = vocab_items | lesson_vocab
            
            # Associer tous les mots trouvés
            if vocab_items.exists():
                exercise.vocabulary_items.add(*vocab_items)
                exercises_updated += 1
                
                # Calculer combien de mots ont été ajoutés
                words_after = exercise.vocabulary_items.count()
                words_added += (words_after - words_before)
        
        # Message de confirmation
        if exercises_updated:
            message = f"✓ {words_added} vocabulary items added to {exercises_updated} speaking exercises."
        else:
            message = "No vocabulary items found for the selected exercises."
            
        self.message_user(request, message)
        
    associate_vocabulary_from_lesson.short_description = "Associate vocabulary items from lessons"


@admin.register(TheoryContent)
class TheoryContentAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_content_title', 'has_formula', 'has_examples', 'format_indicator', 'language_count')
    list_filter = ('content_lesson__lesson__unit', 'using_json_format')
    search_fields = ('content_en', 'content_fr', 'content_lesson__title_en', 'language_specific_content')
    actions = ['migrate_to_json_format', 'add_custom_language']
    
    def get_fieldsets(self, request, obj=None):
        """Affiche différents fieldsets selon que l'objet utilise le format JSON ou non"""
        base_fieldsets = [
            ('Lesson Reference', {
                'fields': ('content_lesson',)
            }),
        ]
        
        # Si l'objet existe et utilise le format JSON
        if obj and obj.using_json_format:
            json_fieldsets = [
                ('Format Settings', {
                    'fields': ('using_json_format', 'available_languages'),
                    'classes': ('collapse',),
                }),
                ('Language Specific Content (JSON Format)', {
                    'fields': ('language_specific_content',),
                    'description': 'This content is in JSON format. Edit with caution.',
                }),
                ('Content Preview', {
                    'fields': ('content_preview',),
                    'classes': ('collapse',),
                }),
            ]
            return base_fieldsets + json_fieldsets
        
        # Sinon, afficher les champs traditionnels
        traditional_fieldsets = [
            ('Format Options', {
                'fields': ('using_json_format',),
                'classes': ('collapse',),
                'description': 'Enable JSON format for more flexible language support.'
            }),
            ('English Content', {
                'fields': ('content_en', 'explication_en', 'formula_en', 'example_en', 'exception_en'),
            }),
            ('French Content', {
                'fields': ('content_fr', 'explication_fr', 'formula_fr', 'example_fr', 'exception_fr'),
            }),
            ('Spanish Content', {
                'fields': ('content_es', 'explication_es', 'formula_es', 'example_es', 'exception_es'),
            }),
            ('Dutch Content', {
                'fields': ('content_nl', 'explication_nl', 'formula_nl', 'example_nl', 'exception_nl'),
            }),
        ]
        return base_fieldsets + traditional_fieldsets
    
    def get_readonly_fields(self, request, obj=None):
        """Définit les champs en lecture seule selon le format utilisé"""
        if obj and obj.using_json_format:
            # Quand on utilise le format JSON, tous les champs traditionnels sont en lecture seule
            return ('content_en', 'content_fr', 'content_es', 'content_nl',
                    'explication_en', 'explication_fr', 'explication_es', 'explication_nl',
                    'formula_en', 'formula_fr', 'formula_es', 'formula_nl',
                    'example_en', 'example_fr', 'example_es', 'example_nl',
                    'exception_en', 'exception_fr', 'exception_es', 'exception_nl',
                    'content_preview')
        return ('content_preview',)
    
    def get_content_title(self, obj):
        return obj.content_lesson.title_en
    get_content_title.short_description = 'Content Title'
    
    def has_formula(self, obj):
        """Vérifie si la théorie a des formules (nouveau ou ancien format)"""
        if obj.using_json_format:
            # Vérifier dans le format JSON
            for lang_data in obj.language_specific_content.values():
                if lang_data.get('formula'):
                    return True
            return False
        # Ancien format
        return bool(obj.formula_en or obj.formula_fr or obj.formula_es or obj.formula_nl)
    has_formula.boolean = True
    
    def has_examples(self, obj):
        """Vérifie si la théorie a des exemples (nouveau ou ancien format)"""
        if obj.using_json_format:
            # Vérifier dans le format JSON
            for lang_data in obj.language_specific_content.values():
                if lang_data.get('example'):
                    return True
            return False
        # Ancien format
        return bool(obj.example_en or obj.example_fr or obj.example_es or obj.example_nl)
    has_examples.boolean = True
    
    def format_indicator(self, obj):
        """Indique quel format est utilisé"""
        if obj.using_json_format:
            return "JSON Format ✓"
        return "Traditional Format"
    format_indicator.short_description = "Format"
    
    def language_count(self, obj):
        """Affiche le nombre de langues disponibles"""
        if obj.using_json_format:
            return len(obj.available_languages)
        # Compter les langues disponibles dans l'ancien format
        count = 0
        for lang in ['en', 'fr', 'es', 'nl']:
            if getattr(obj, f'content_{lang}'):
                count += 1
        return count
    language_count.short_description = "Languages"
    
    def content_preview(self, obj):
        """Champ virtuel pour afficher un aperçu du contenu dans différentes langues"""
        if not obj.using_json_format:
            return "Switch to JSON format to see content preview"
        
        html = ['<div style="max-height: 400px; overflow-y: auto;">']
        
        for lang in obj.available_languages:
            lang_data = obj.language_specific_content.get(lang, {})
            
            html.append(f'<h3 style="margin-top: 15px; padding: 5px; background-color: #f5f5f5;">{lang.upper()}</h3>')
            
            # Content
            if 'content' in lang_data:
                html.append(f'<p><strong>Content:</strong> {lang_data["content"]}</p>')
            
            # Explanation
            if 'explanation' in lang_data:
                html.append(f'<p><strong>Explanation:</strong> {lang_data["explanation"]}</p>')
            
            # Formula
            if 'formula' in lang_data:
                html.append(f'<p><strong>Formula:</strong> {lang_data["formula"]}</p>')
            
            # Example
            if 'example' in lang_data:
                html.append(f'<p><strong>Example:</strong> {lang_data["example"]}</p>')
            
            # Exception
            if 'exception' in lang_data:
                html.append(f'<p><strong>Exception:</strong> {lang_data["exception"]}</p>')
            
            # Language-specific fields
            for key, value in lang_data.items():
                if key not in ['content', 'explanation', 'formula', 'example', 'exception']:
                    html.append(f'<p><strong>{key}:</strong> {value}</p>')
            
            html.append('<hr>')
        
        html.append('</div>')
        return mark_safe(''.join(html))
    content_preview.short_description = "Content Preview"
    
    # Actions personnalisées
    @admin.action(description="Migrer vers le format JSON")
    def migrate_to_json_format(self, request, queryset):
        """Action pour migrer les théories vers le format JSON"""
        migrated = 0
        for theory in queryset:
            if not theory.using_json_format:
                theory.migrate_to_json_format()
                migrated += 1
        
        self.message_user(
            request,
            f"{migrated} théories ont été migrées avec succès vers le format JSON.",
            messages.SUCCESS
        )
    
    @admin.action(description="Ajouter une langue personnalisée")
    def add_custom_language(self, request, queryset):
        """Action pour ajouter une langue personnalisée"""
        # Cette action nécessiterait un formulaire personnalisé
        # qui demanderait le code de langue et les données à ajouter
        # Exemple simplifié:
        if queryset.count() != 1:
            self.message_user(
                request,
                "Veuillez sélectionner une seule théorie pour ajouter une langue.",
                messages.ERROR
            )
            return
        
        theory = queryset.first()
        
        # Rediriger vers une vue personnalisée qui affichera un formulaire
        return HttpResponseRedirect(
            reverse('admin:add_custom_language', args=[theory.pk])
        )
    
    # Surcharger get_urls pour ajouter des vues personnalisées
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                '<path:object_id>/add-language/',
                self.admin_site.admin_view(self.add_language_view),
                name='add_custom_language',
            ),
        ]
        return custom_urls + urls
    
    def add_language_view(self, request, object_id):
        """Vue personnalisée pour ajouter une langue à une théorie"""
        theory = get_object_or_404(TheoryContent, pk=object_id)
        
        # À implémenter: un formulaire pour ajouter une langue
        context = {
            'title': f'Add Language to Theory {object_id}',
            'theory': theory,
            # Autres éléments de contexte...
        }
        
        # Exemple minimal - à développer selon vos besoins
        return TemplateResponse(request, 'admin/add_language_form.html', context)


@admin.register(VocabularyList)
class VocabularyListAdmin(admin.ModelAdmin):
    list_display = ('id', 'word_en', 'word_fr', 'word_type_en', 'content_lesson')
    list_filter = ('content_lesson__lesson__unit', 'word_type_en')
    search_fields = ('word_en', 'word_fr', 'definition_en')
    fieldsets = (
        ('Lesson Reference', {
            'fields': ('content_lesson',)
        }),
        ('English', {
            'fields': ('word_en', 'definition_en', 'example_sentence_en', 'word_type_en', 'synonymous_en', 'antonymous_en'),
        }),
        ('French', {
            'fields': ('word_fr', 'definition_fr', 'example_sentence_fr', 'word_type_fr', 'synonymous_fr', 'antonymous_fr'),
        }),
        ('Spanish', {
            'fields': ('word_es', 'definition_es', 'example_sentence_es', 'word_type_es', 'synonymous_es', 'antonymous_es'),
        }),
        ('Dutch', {
            'fields': ('word_nl', 'definition_nl', 'example_sentence_nl', 'word_type_nl', 'synonymous_nl', 'antonymous_nl'),
        }),
    )


@admin.register(Numbers)
class NumbersAdmin(admin.ModelAdmin):
    list_display = ('id', 'number', 'number_en', 'number_fr', 'is_reviewed', 'content_lesson')
    list_filter = ('is_reviewed', 'content_lesson__lesson__unit')
    search_fields = ('number', 'number_en', 'number_fr')
    list_editable = ('is_reviewed',)


@admin.register(MatchingExercise)
class MatchingExerciseAdmin(admin.ModelAdmin):
    """Interface d'administration pour les exercices d'association."""
    
    # Affichage dans la liste
    list_display = ('id', 'get_content_lesson_title', 'difficulty', 'pairs_count', 'order', 'created_at')
    list_filter = ('difficulty', 'content_lesson__lesson__unit__level')
    search_fields = ('title_en', 'title_fr', 'content_lesson__title_en')
    
    # Mise en page du formulaire
    fieldsets = (
        ('Informations de base', {
            'fields': ('content_lesson', 'difficulty', 'order')
        }),
        ('Titres', {
            'fields': ('title_en', 'title_fr', 'title_es', 'title_nl'),
            'description': 'Les titres peuvent être personnalisés pour chaque exercice.'
        }),
        ('Configuration', {
            'fields': ('pairs_count', 'vocabulary_words'),
            'description': 'Sélectionnez les mots à inclure dans l\'exercice.'
        }),
    )
    
    # Relations
    filter_horizontal = ('vocabulary_words',)
    
    def get_content_lesson_title(self, obj):
        """Affiche le titre de la leçon associée pour faciliter l'identification."""
        return obj.content_lesson.title_en
    get_content_lesson_title.short_description = 'Leçon'
    get_content_lesson_title.admin_order_field = 'content_lesson__title_en'
    
    def formfield_for_manytomany(self, db_field, request, **kwargs):
        """
        Filtre les mots disponibles en fonction de la leçon sélectionnée,
        pour simplifier la création des exercices.
        """
        if db_field.name == 'vocabulary_words':
            if request._obj is not None:
                kwargs['queryset'] = VocabularyList.objects.filter(
                    content_lesson=request._obj.content_lesson
                )
            elif 'content_lesson' in request.GET:
                content_lesson_id = request.GET.get('content_lesson')
                kwargs['queryset'] = VocabularyList.objects.filter(
                    content_lesson_id=content_lesson_id
                )
        return super().formfield_for_manytomany(db_field, request, **kwargs)
    
    def get_form(self, request, obj=None, **kwargs):
        """Conserve une référence à l'objet en cours d'édition pour le filtrage."""
        request._obj = obj
        return super().get_form(request, obj, **kwargs)
    
    def add_view(self, request, form_url='', extra_context=None):
        """
        Personnalise la vue d'ajout pour inclure des informations supplémentaires
        sur les instructions standardisées.
        """
        extra_context = extra_context or {}
        extra_context['instructions_note'] = (
            "Les instructions d'utilisation sont standardisées et identiques "
            "pour tous les exercices d'association, conformément aux exigences pédagogiques."
        )
        return super().add_view(request, form_url, extra_context)
    
    actions = ['associate_vocabulary_from_lesson']
    
    def associate_vocabulary_from_lesson(self, request, queryset):
        """Action to automatically associate all relevant vocabulary with selected matching exercises"""
        total_exercises = queryset.count()
        exercises_updated = 0
        words_added = 0
        
        for exercise in queryset:
            content_lesson = exercise.content_lesson
            parent_lesson = content_lesson.lesson
            
            # Memorize the number of words before the operation
            words_before = exercise.vocabulary_words.count()
            
            # 1. Try to find vocabulary in the same content lesson
            vocab_items = VocabularyList.objects.filter(content_lesson=content_lesson)
            
            # 2. If no words, look in vocabulary content lessons in the same lesson
            if not vocab_items.exists():
                vocab_lessons = ContentLesson.objects.filter(
                    lesson=parent_lesson,
                    content_type__iexact='vocabulary'
                )
                
                for vocab_lesson in vocab_lessons:
                    lesson_vocab = VocabularyList.objects.filter(content_lesson=vocab_lesson)
                    if vocab_items.exists():
                        vocab_items = vocab_items | lesson_vocab
                    else:
                        vocab_items = lesson_vocab
            
            # Associate all found words, limited by pairs_count
            if vocab_items.exists():
                # Limit to the pairs_count specified in the exercise
                vocab_items = vocab_items[:exercise.pairs_count]
                exercise.vocabulary_words.add(*vocab_items)
                exercises_updated += 1
                
                # Calculate how many words were added
                words_after = exercise.vocabulary_words.count()
                words_added += (words_after - words_before)
        
        # Confirmation message
        if exercises_updated:
            message = f"✓ {words_added} vocabulary items added to {exercises_updated} matching exercises."
        else:
            message = "No vocabulary items found for the selected exercises."
            
        self.message_user(request, message)
        
    associate_vocabulary_from_lesson.short_description = "Associate vocabulary items from lessons"


@admin.register(MultipleChoiceQuestion)
class MultipleChoiceQuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'question_en', 'correct_answer_en', 'content_lesson')
    list_filter = ('content_lesson__lesson__unit',)
    search_fields = ('question_en', 'question_fr')
    fieldsets = (
        ('Lesson Reference', {
            'fields': ('content_lesson',)
        }),
        ('English', {
            'fields': ('question_en', 'correct_answer_en', 'fake_answer1_en', 'fake_answer2_en', 
                      'fake_answer3_en', 'fake_answer4_en', 'hint_answer_en'),
        }),
        ('French', {
            'fields': ('question_fr', 'correct_answer_fr', 'fake_answer1_fr', 'fake_answer2_fr', 
                      'fake_answer3_fr', 'fake_answer4_fr', 'hint_answer_fr'),
        }),
        ('Spanish', {
            'fields': ('question_es', 'correct_answer_es', 'fake_answer1_es', 'fake_answer2_es', 
                      'fake_answer3_es', 'fake_answer4_es', 'hint_answer_es'),
        }),
        ('Dutch', {
            'fields': ('question_nl', 'correct_answer_nl', 'fake_answer1_nl', 'fake_answer2_nl', 
                      'fake_answer3_nl', 'fake_answer4_nl', 'hint_answer_nl'),
        }),
    )


@admin.register(ExerciseGrammarReordering)
class ExerciseGrammarReorderingAdmin(admin.ModelAdmin):
    list_display = ('id', 'sentence_en', 'content_lesson')
    list_filter = ('content_lesson__lesson__unit',)
    search_fields = ('sentence_en', 'sentence_fr')
    fieldsets = (
        ('Lesson Reference', {
            'fields': ('content_lesson',)
        }),
        ('Sentence Variations', {
            'fields': ('sentence_en', 'sentence_fr', 'sentence_es', 'sentence_nl'),
        }),
        ('Help Text', {
            'fields': ('explanation', 'hint'),
        }),
    )


@admin.register(ExerciseVocabularyMultipleChoice)
class ExerciseVocabularyMultipleChoiceAdmin(admin.ModelAdmin):
    list_display = ('id', 'question', 'correct_answer', 'lesson')
    list_filter = ('lesson__unit',)
    search_fields = ('question', 'correct_answer')


class FillBlankExerciseAdminForm(forms.ModelForm):
    """Enhanced custom form for Fill in the Blank exercises admin"""
    
    instructions = AdminJSONFormField(
        label="Instructions",
        help_text="Instructions for each language (e.g. 'Select the right word')"
    )
    
    sentences = AdminJSONFormField(
        label="Sentences with Blanks",
        help_text="Use ___ to mark where the blank should appear (e.g. 'Paris is ___ in France.')"
    )
    
    answer_options = AdminJSONFormField(
        label="Answer Options",
        help_text="List of possible answers for each language"
    )
    
    correct_answers = AdminJSONFormField(
        label="Correct Answers",
        help_text="The correct answer for each language"
    )
    
    hints = AdminJSONFormField(
        label="Hints",
        help_text="Optional hints to help users (shown when they're stuck)",
        required=False
    )
    
    explanations = AdminJSONFormField(
        label="Explanations",
        help_text="Explanations why the answer is correct (shown after answering)",
        required=False
    )
    
    tags = AdminJSONFormField(
        label="Tags",
        help_text="Tags for categorizing this exercise (e.g. ['grammar', 'beginner'])",
        required=False
    )
    
    class Meta:
        model = FillBlankExercise
        fields = '__all__'

    def clean(self):
        """Advanced validation to ensure consistency"""
        cleaned_data = super().clean()
        
        sentences = cleaned_data.get('sentences', {})
        answer_options = cleaned_data.get('answer_options', {})
        correct_answers = cleaned_data.get('correct_answers', {})
        
        errors = []
        
        # For each language, verify that:
        # 1. The sentence contains the blank marker
        # 2. The correct answer is in the options list
        # 3. The blank can fit the longest option reasonably
        for lang in sentences.keys():
            sentence = sentences.get(lang, '')
            options = answer_options.get(lang, [])
            correct = correct_answers.get(lang, '')
            
            if '___' not in sentence:
                errors.append(f"The sentence for language '{lang}' does not contain a blank (___)")
            
            if options and correct and correct not in options:
                errors.append(f"The correct answer '{correct}' for language '{lang}' is not in the options list")
            
            if options:
                max_option_len = max([len(opt) for opt in options]) if options else 0
                if max_option_len > 50:  # Arbitrary threshold for very long options
                    errors.append(f"Some options for language '{lang}' are very long. Consider shortening them.")
        
        if errors:
            raise forms.ValidationError(errors)
            
        return cleaned_data


@admin.register(FillBlankExercise)
class FillBlankExerciseAdmin(admin.ModelAdmin):
    """Enhanced admin interface for Fill in the Blank exercises"""
    form = FillBlankExerciseAdminForm
    
    list_display = ('id', 'get_content_lesson', 'get_example_sentence', 'get_available_languages', 
                   'difficulty', 'order', 'created_at')
    list_filter = ('difficulty', 'content_lesson__lesson__unit', 'content_lesson__lesson__unit__level', 'created_at')
    search_fields = ('id', 'content_lesson__title_en', 'content_lesson__lesson__title_en', 'sentences')
    ordering = ('content_lesson', 'order')
    readonly_fields = ('created_at', 'updated_at', 'json_preview', 'lang_consistency_check', 
                       'live_preview', 'answer_validation')
    save_on_top = True
    actions = ['duplicate_exercises', 'export_as_csv', 'export_as_json']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('content_lesson', 'order', 'difficulty')
        }),
        ('Multilingual Content', {
            'fields': ('instructions', 'sentences', 'answer_options', 'correct_answers'),
            'description': 'Set up content in multiple languages (EN, FR, ES, NL, etc.)'
        }),
        ('Learning Aids', {
            'fields': ('hints', 'explanations'),
            'description': 'Optional - Help the user understand the exercise',
            'classes': ('collapse',),
        }),
        ('Live Preview', {
            'fields': ('live_preview',),
            'description': 'See how this exercise will appear to users',
        }),
        ('Validation', {
            'fields': ('answer_validation', 'lang_consistency_check'),
            'description': 'Verify the correctness of your exercise',
            'classes': ('collapse',),
        }),
        ('Metadata', {
            'fields': ('tags', 'created_at', 'updated_at', 'json_preview'),
            'description': 'Additional information and raw data',
            'classes': ('collapse',),
        }),
    )
    
    def get_content_lesson(self, obj):
        """Display the lesson title with unit info"""
        try:
            unit = obj.content_lesson.lesson.unit
            return format_html(
                '<span title="Unit: {}">[{}] {}</span>',
                unit.title_en,
                unit.level,
                obj.content_lesson.title_en
            )
        except:
            return obj.content_lesson.title_en if obj.content_lesson else "—"
    get_content_lesson.short_description = 'Lesson'
    get_content_lesson.admin_order_field = 'content_lesson__title_en'
    
    def get_example_sentence(self, obj):
        """Display a preview of the exercise sentence"""
        # Try to get English sentence, fallback to first available language
        languages = obj.get_available_languages()
        sentence = ''
        if 'en' in languages and 'en' in obj.sentences:
            sentence = obj.sentences['en']
        elif languages and languages[0] in obj.sentences:
            sentence = obj.sentences[languages[0]]
        
        if not sentence:
            return '—'
        
        # Replace blank with visual indicator
        formatted = sentence.replace('___', '<span style="color: #e91e63; font-weight: bold;">___</span>')
        return format_html('<span style="font-size: 0.85em;">{}</span>', formatted)
    get_example_sentence.short_description = 'Example'
    
    def get_available_languages(self, obj):
        """Display available languages with colored badges"""
        languages = obj.get_available_languages()
        
        # Mappings for language names and colors
        language_names = {
            'en': 'English',
            'fr': 'French',
            'es': 'Spanish',
            'nl': 'Dutch',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ru': 'Russian',
            'zh': 'Chinese',
            'ja': 'Japanese',
            'ar': 'Arabic',
        }
        
        colors = {
            'en': '#2196F3', # Blue
            'fr': '#F44336', # Red
            'es': '#FF9800', # Orange
            'nl': '#9C27B0', # Purple
            'de': '#4CAF50', # Green
            'it': '#795548', # Brown
            'pt': '#009688', # Teal
        }
        
        html = []
        for lang in languages:
            color = colors.get(lang, '#607D8B')  # Gray as default
            name = language_names.get(lang, lang.upper())
            html.append(
                f'<span style="background-color: {color}; color: white; padding: 2px 6px; '
                f'border-radius: 3px; margin: 0 2px; font-size: 0.85em;">{name}</span>'
            )
        
        return format_html(' '.join(html) if html else '<span style="color: #999;">None</span>')
    get_available_languages.short_description = 'Languages'
    
    def json_preview(self, obj):
        """Display a formatted JSON preview of the exercise data"""
        sample_data = {
            'instructions': obj.instructions,
            'sentences': obj.sentences,
            'answer_options': obj.answer_options,
            'correct_answers': obj.correct_answers,
        }
        
        formatted_json = json.dumps(sample_data, indent=2, ensure_ascii=False)
        
        return format_html(
            '<div style="font-family: monospace; white-space: pre; '
            'background-color: #f5f5f5; padding: 10px; border-radius: 4px; '
            'max-height: 400px; overflow-y: auto;">{}</div>',
            formatted_json
        )
    json_preview.short_description = 'JSON Data'
    
    def lang_consistency_check(self, obj):
        """Check consistency between languages in different fields"""
        sentence_langs = set(obj.sentences.keys() if obj.sentences else [])
        answer_langs = set(obj.correct_answers.keys() if obj.correct_answers else [])
        options_langs = set(obj.answer_options.keys() if obj.answer_options else [])
        instruction_langs = set(obj.instructions.keys() if obj.instructions else [])
        
        all_langs = sentence_langs.union(answer_langs).union(options_langs).union(instruction_langs)
        
        # Create HTML table for verification
        html = ['<table class="lang-consistency-table" style="width: 100%; border-collapse: collapse;">']
        
        # Table header
        html.append('<thead><tr style="background-color: #263238; color: white;">')
        html.append('<th style="padding: 8px; text-align: left;">Language</th>')
        html.append('<th style="padding: 8px; text-align: center;">Instructions</th>')
        html.append('<th style="padding: 8px; text-align: center;">Sentence</th>')
        html.append('<th style="padding: 8px; text-align: center;">Options</th>')
        html.append('<th style="padding: 8px; text-align: center;">Answer</th>')
        html.append('<th style="padding: 8px; text-align: center;">Status</th>')
        html.append('</tr></thead><tbody>')
        
        # Table body
        for lang in sorted(all_langs):
            has_instruction = lang in instruction_langs
            has_sentence = lang in sentence_langs
            has_options = lang in options_langs
            has_answer = lang in answer_langs
            
            is_complete = has_instruction and has_sentence and has_options and has_answer
            status_label = 'Complete' if is_complete else 'Incomplete'
            bg_color = '#e8f5e9' if is_complete else '#ffebee'
            
            html.append(f'<tr style="background-color: {bg_color};">')
            html.append(f'<td style="padding: 8px; font-weight: bold;">{lang.upper()}</td>')
            
            for has_item in [has_instruction, has_sentence, has_options, has_answer]:
                icon = "✓" if has_item else "✗"
                color = "#4CAF50" if has_item else "#F44336"
                html.append(f'<td style="padding: 8px; text-align: center; color: {color}; font-weight: bold;">{icon}</td>')
            
            status_color = '#2E7D32' if is_complete else '#C62828'
            html.append(f'<td style="padding: 8px; text-align: center; font-weight: bold; color: {status_color};">{status_label}</td>')
            html.append('</tr>')
        
        html.append('</tbody></table>')
        
        # Summary section
        complete_langs = sum(1 for lang in all_langs if lang in sentence_langs and lang in options_langs 
                           and lang in answer_langs and lang in instruction_langs)
        
        html.append('<div style="margin-top: 15px; padding: 10px; background-color: #f9f9f9; border-radius: 4px;">')
        html.append(f'<p style="margin: 5px 0;"><strong>{complete_langs}</strong> complete languages out of <strong>{len(all_langs)}</strong> languages detected.</p>')
        
        if complete_langs < len(all_langs):
            html.append('<p style="margin: 5px 0; color: #C62828;"><strong>⚠️ Warning:</strong> Some languages are incomplete.</p>')
            
            # Add specific recommendations
            for lang in all_langs:
                missing = []
                if lang not in instruction_langs: missing.append("instructions")
                if lang not in sentence_langs: missing.append("sentence")
                if lang not in options_langs: missing.append("options")
                if lang not in answer_langs: missing.append("correct answer")
                
                if missing:
                    html.append(f'<p style="margin: 3px 0; color: #555;">Language <strong>{lang.upper()}</strong> is missing: {", ".join(missing)}</p>')
        
        html.append('</div>')
        
        # Add quick fix buttons
        if complete_langs < len(all_langs):
            html.append('<div style="margin-top: 10px;">')
            html.append('<p><strong>Quick Actions:</strong></p>')
            html.append('<div style="display: flex; gap: 5px; flex-wrap: wrap;">')
            
            for lang in all_langs:
                if lang in sentence_langs and lang in options_langs and lang in answer_langs and lang in instruction_langs:
                    continue  # Skip complete languages
                    
                html.append(f'<button type="button" class="button" onclick="completeLanguage(\'{lang}\')" '
                           f'style="background-color: #2196F3; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer;">'
                           f'Complete {lang.upper()}</button>')
            
            html.append('</div>')
            html.append('</div>')
            
            # Add simple JavaScript for the demo
            html.append('''
            <script>
            function completeLanguage(lang) {
                alert("This would complete the missing fields for language: " + lang.toUpperCase() + 
                      "\\n\\nIn a real implementation, this would copy from other languages or generate placeholders.");
            }
            </script>
            ''')
        
        return format_html(''.join(html))
    lang_consistency_check.short_description = 'Language Consistency'
    
    def live_preview(self, obj):
        """Create an interactive preview of how the exercise will look"""
        languages = obj.get_available_languages()
        if not languages:
            return format_html('<div style="padding: 20px; text-align: center; color: #666; background-color: #f5f5f5; border-radius: 4px;">'
                              'No language content available to preview</div>')
        
        # Create tabs for each language
        html = ['<div class="exercise-preview">']
        
        # Language selector tabs
        html.append('<div class="language-tabs" style="display: flex; gap: 5px; margin-bottom: 10px;">')
        for i, lang in enumerate(languages):
            active = 'active' if i == 0 else ''
            html.append(f'<button type="button" class="lang-tab {active}" data-lang="{lang}" '
                       f'style="background-color: {active and "#2196F3" or "#e0e0e0"}; color: {active and "white" or "#333"}; '
                       f'border: none; padding: 8px 12px; border-radius: 4px 4px 0 0; cursor: pointer;">'
                       f'{lang.upper()}</button>')
        html.append('</div>')
        
        # Exercise content for each language
        html.append('<div class="preview-content" style="border: 1px solid #ddd; border-radius: 0 4px 4px 4px; padding: 20px; background-color: white;">')
        for i, lang in enumerate(languages):
            display = 'block' if i == 0 else 'none'
            
            sentence = obj.sentences.get(lang, '')
            options = obj.answer_options.get(lang, [])
            instruction = obj.instructions.get(lang, 'Select the correct answer')
            correct = obj.correct_answers.get(lang, '')
            
            # Format sentence with blank
            parts = sentence.split('___')
            formatted_sentence = (parts[0] + 
                                 '<span class="blank" style="border-bottom: 2px dashed #2196F3; padding: 0 5px; color: transparent;">___</span>' + 
                                 parts[1]) if len(parts) > 1 else sentence
            
            html.append(f'<div class="lang-content" data-lang="{lang}" style="display: {display};">')
            html.append(f'<h3 style="margin-top: 0; color: #333;">{instruction}</h3>')
            html.append(f'<p class="sentence" style="font-size: 18px; margin: 20px 0;">{formatted_sentence}</p>')
            
            # Options
            html.append('<div class="options" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px;">')
            for option in options:
                is_correct = option == correct
                data_attr = f'data-correct="{is_correct}"'
                html.append(f'<button type="button" class="option-btn" {data_attr} '
                           f'style="background-color: #f5f5f5; border: 1px solid #ddd; padding: 8px 12px; '
                           f'border-radius: 4px; cursor: pointer; font-size: 16px;">{option}</button>')
            html.append('</div>')
            
            # Feedback area (initially hidden)
            html.append('<div class="feedback" style="margin-top: 20px; padding: 12px; border-radius: 4px; display: none;"></div>')
            
            html.append('</div>')
        html.append('</div>')
        
        # Add JavaScript for interactivity
        html.append('''
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Switch tabs
            document.querySelectorAll('.lang-tab').forEach(tab => {
                tab.addEventListener('click', function() {
                    const lang = this.dataset.lang;
                    
                    // Update tab styling
                    document.querySelectorAll('.lang-tab').forEach(t => {
                        t.style.backgroundColor = '#e0e0e0';
                        t.style.color = '#333';
                        t.classList.remove('active');
                    });
                    this.style.backgroundColor = '#2196F3';
                    this.style.color = 'white';
                    this.classList.add('active');
                    
                    // Show selected content
                    document.querySelectorAll('.lang-content').forEach(content => {
                        content.style.display = content.dataset.lang === lang ? 'block' : 'none';
                    });
                });
            });
            
            // Handle option selection
            document.querySelectorAll('.option-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const isCorrect = this.dataset.correct === 'true';
                    const content = this.closest('.lang-content');
                    const feedback = content.querySelector('.feedback');
                    const sentence = content.querySelector('.sentence');
                    const blank = sentence.querySelector('.blank');
                    
                    // Update blank with the selected option
                    blank.textContent = this.textContent;
                    blank.style.color = 'inherit';
                    blank.style.borderBottom = 'none';
                    blank.style.backgroundColor = isCorrect ? '#E8F5E9' : '#FFEBEE';
                    
                    // Disable all buttons
                    content.querySelectorAll('.option-btn').forEach(b => {
                        b.style.opacity = '0.5';
                        b.style.cursor = 'default';
                        b.disabled = true;
                    });
                    
                    // Highlight the clicked button
                    this.style.opacity = '1';
                    this.style.backgroundColor = isCorrect ? '#4CAF50' : '#F44336';
                    this.style.color = 'white';
                    
                    // Show feedback
                    feedback.style.display = 'block';
                    feedback.style.backgroundColor = isCorrect ? '#E8F5E9' : '#FFEBEE';
                    feedback.style.color = isCorrect ? '#2E7D32' : '#C62828';
                    feedback.innerHTML = isCorrect ? 
                        '<strong>Correct!</strong> Well done.' : 
                        '<strong>Incorrect.</strong> Try again.';
                });
            });
        });
        </script>
        ''')
        
        html.append('</div>')
        
        return format_html(''.join(html))
    live_preview.short_description = 'Exercise Preview'
    
    def answer_validation(self, obj):
        """Validate that correct answers are in the options and other checks"""
        languages = obj.get_available_languages()
        if not languages:
            return format_html('<div style="padding: 10px; color: #666;">No content to validate</div>')
        
        issues = []
        
        # Check for each language
        for lang in languages:
            sentence = obj.sentences.get(lang, '')
            options = obj.answer_options.get(lang, [])
            correct = obj.correct_answers.get(lang, '')
            
            # Check if sentence has a blank
            if '___' not in sentence:
                issues.append((
                    'error', 
                    f'The sentence for language <strong>{lang.upper()}</strong> does not contain a blank marker (___)'
                ))
            
            # Check if correct answer is in options
            if options and correct and correct not in options:
                issues.append((
                    'error',
                    f'The correct answer <strong>"{correct}"</strong> for language <strong>{lang.upper()}</strong> is not in the options list'
                ))
            
            # Check if options contain duplicates
            if options and len(options) != len(set(options)):
                issues.append((
                    'warning',
                    f'The options for language <strong>{lang.upper()}</strong> contain duplicate values'
                ))
            
            # Check if blank is too small for options
            if options:
                max_len = max([len(opt) for opt in options])
                if max_len > 30:  # Arbitrary threshold
                    issues.append((
                        'warning',
                        f'Some answer options for language <strong>{lang.upper()}</strong> are very long ({max_len} chars)'
                    ))
        
        # Build the output HTML
        html = ['<div class="validation-results">']
        
        if not issues:
            html.append('<div style="padding: 10px; background-color: #E8F5E9; color: #2E7D32; border-radius: 4px;">'
                        '<strong>✓ All validation checks passed!</strong> No issues found.'
                        '</div>')
        else:
            html.append('<div style="padding: 10px; background-color: #FFF3E0; color: #E65100; border-radius: 4px;">'
                        f'<strong>⚠️ {len(issues)} issue(s) found</strong>'
                        '</div>')
            
            html.append('<ul style="list-style-type: none; padding-left: 0;">')
            for issue_type, message in issues:
                icon = '❌' if issue_type == 'error' else '⚠️'
                color = '#C62828' if issue_type == 'error' else '#F57F17'
                html.append(f'<li style="margin: 8px 0; padding: 8px; background-color: {issue_type == "error" and "#FFEBEE" or "#FFF8E1"}; '
                           f'border-radius: 4px; color: {color};">{icon} {message}</li>')
            html.append('</ul>')
        
        html.append('</div>')
        
        return format_html(''.join(html))
    answer_validation.short_description = 'Validation Results'
    
    def save_model(self, request, obj, form, change):
        """Validate and clean JSON data before saving"""
        # Ensure instructions field exists for all languages
        if not hasattr(obj, 'instructions') or not obj.instructions:
            obj.instructions = {}
        
        # For each language in sentences, ensure it has instructions
        for lang in obj.sentences.keys():
            if lang not in obj.instructions:
                # Add default instruction based on language
                if lang == 'en':
                    obj.instructions[lang] = "Select the correct answer to fill in the blank."
                elif lang == 'fr':
                    obj.instructions[lang] = "Sélectionnez la bonne réponse pour compléter la phrase."
                elif lang == 'es':
                    obj.instructions[lang] = "Selecciona la respuesta correcta para completar el espacio en blanco."
                elif lang == 'nl':
                    obj.instructions[lang] = "Selecteer het juiste antwoord om de zin aan te vullen."
                else:
                    obj.instructions[lang] = "Select the correct answer."
        
        # Check for inconsistencies between fields
        sentence_langs = set(obj.sentences.keys() if obj.sentences else [])
        answer_langs = set(obj.correct_answers.keys() if obj.correct_answers else [])
        options_langs = set(obj.answer_options.keys() if obj.answer_options else [])
        
        # Identify missing elements
        missing_sentences = answer_langs.difference(sentence_langs)
        missing_answers = sentence_langs.difference(answer_langs)
        missing_options = sentence_langs.difference(options_langs)
        
        # Display warnings for inconsistencies
        warnings = []
        
        if missing_sentences:
            warnings.append(f"Missing sentences for languages: {', '.join(missing_sentences)}")
        
        if missing_answers:
            warnings.append(f"Missing correct answers for languages: {', '.join(missing_answers)}")
            
        if missing_options:
            warnings.append(f"Missing answer options for languages: {', '.join(missing_options)}")
        
        for warning in warnings:
            self.message_user(
                request, 
                f"⚠️ {warning}",
                level=messages.WARNING
            )
        
        super().save_model(request, obj, form, change)
    
    # Custom actions
    def duplicate_exercises(self, request, queryset):
        """Create copies of selected exercises"""
        count = 0
        for exercise in queryset:
            # Create new object
            new_exercise = FillBlankExercise.objects.create(
                content_lesson=exercise.content_lesson,
                order=exercise.order + 1000,  # Temporary high order to avoid collision
                difficulty=exercise.difficulty,
                instructions=exercise.instructions,
                sentences=exercise.sentences,
                answer_options=exercise.answer_options,
                correct_answers=exercise.correct_answers,
                hints=exercise.hints,
                explanations=exercise.explanations,
                tags=exercise.tags
            )
            count += 1
        
        # Reorder exercises
        self._reorder_exercises()
        
        self.message_user(request, f"Successfully duplicated {count} exercise(s).", messages.SUCCESS)
    duplicate_exercises.short_description = "Duplicate selected exercises"
    
    def export_as_csv(self, request, queryset):
        """Export selected exercises as CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="exercises.csv"'
        
        writer = csv.writer(response)
        # Write header
        writer.writerow([
            'ID', 'Content Lesson', 'Order', 'Difficulty', 
            'Languages', 'Created', 'Updated'
        ])
        
        for obj in queryset:
            writer.writerow([
                obj.id,
                obj.content_lesson.title_en if obj.content_lesson else '',
                obj.order,
                obj.difficulty,
                ', '.join(obj.get_available_languages()),
                obj.created_at.strftime('%Y-%m-%d %H:%M'),
                obj.updated_at.strftime('%Y-%m-%d %H:%M')
            ])
        
        return response
    export_as_csv.short_description = "Export selected as CSV"
    
    def export_as_json(self, request, queryset):
        """Export selected exercises as JSON"""
        data = []
        for obj in queryset:
            data.append({
                'id': obj.id,
                'content_lesson_id': obj.content_lesson_id,
                'order': obj.order,
                'difficulty': obj.difficulty,
                'instructions': obj.instructions,
                'sentences': obj.sentences,
                'answer_options': obj.answer_options,
                'correct_answers': obj.correct_answers,
                'hints': obj.hints,
                'explanations': obj.explanations,
                'tags': obj.tags,
                'created_at': obj.created_at.isoformat(),
                'updated_at': obj.updated_at.isoformat()
            })
        
        response = HttpResponse(
            json.dumps(data, indent=2, ensure_ascii=False),
            content_type='application/json'
        )
        response['Content-Disposition'] = 'attachment; filename="exercises.json"'
        return response
    export_as_json.short_description = "Export selected as JSON"
    
    def _reorder_exercises(self):
        """Reorder exercises by content_lesson to ensure consistent ordering"""
        from django.db.models import F, Window
        from django.db.models.functions import RowNumber
        
        # Group by content_lesson and assign new order values
        content_lessons = FillBlankExercise.objects.values_list('content_lesson', flat=True).distinct()
        
        for content_lesson_id in content_lessons:
            exercises = FillBlankExercise.objects.filter(content_lesson_id=content_lesson_id).order_by('order')
            
            # Update order sequentially
            for i, exercise in enumerate(exercises, 1):
                if exercise.order != i:
                    exercise.order = i
                    exercise.save(update_fields=['order'])
    
    # Custom views
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('import-csv/', self.admin_site.admin_view(self.import_csv_view), name='fillblankexercise_import_csv'),
            path('export-template/', self.admin_site.admin_view(self.export_template_view), name='fillblankexercise_export_template'),
            path('bulk-create/', self.admin_site.admin_view(self.bulk_create_view), name='fillblankexercise_bulk_create'),
            path('preview/<int:pk>/', self.admin_site.admin_view(self.preview_view), name='fillblankexercise_preview'),
        ]
        return custom_urls + urls
    
    def import_csv_view(self, request):
        """Improved view for importing exercises from CSV"""
        context = {
            **self.admin_site.each_context(request),
            'opts': self.model._meta,
            'title': 'Import Fill in the Blank Exercises',
            'content_lessons': ContentLesson.objects.select_related('lesson__unit').order_by(
                'lesson__unit__level', 'lesson__unit__order', 'lesson__order', 'order'
            ),
        }
        
        if request.method == 'POST':
            csv_file = request.FILES.get('csv_file')
            content_lesson_id = request.POST.get('content_lesson')
            
            if not csv_file:
                messages.error(request, "No CSV file selected")
                return TemplateResponse(request, "admin/fillblankexercise/import_csv.html", context)
            
            if not content_lesson_id:
                messages.error(request, "No content lesson selected")
                return TemplateResponse(request, "admin/fillblankexercise/import_csv.html", context)
            
            try:
                content_lesson = ContentLesson.objects.get(id=content_lesson_id)
                
                # Parse CSV file
                csv_data = csv_file.read().decode('utf-8')
                reader = csv.DictReader(io.StringIO(csv_data))
                
                # Process each row
                exercises_created = []
                errors = []
                
                for i, row in enumerate(reader, start=1):
                    try:
                        # Extract languages from headers
                        languages = self._extract_languages_from_headers(reader.fieldnames)
                        
                        # Basic validation
                        if not self._validate_csv_row(row, languages):
                            errors.append(f"Row {i}: Incomplete or invalid data")
                            continue
                        
                        # Prepare data structures
                        sentences = {}
                        options = {}
                        answers = {}
                        hints = {}
                        explanations = {}
                        
                        # Populate data for each language
                        for lang in languages:
                            # Required fields
                            sentence_key = f'sentence_{lang}'
                            options_key = f'options_{lang}'
                            answer_key = f'answer_{lang}'
                            
                            if sentence_key in row and row[sentence_key]:
                                sentences[lang] = row[sentence_key]
                            
                            if options_key in row and row[options_key]:
                                # Convert comma-separated options to list
                                options[lang] = [opt.strip() for opt in row[options_key].split(',')]
                            
                            if answer_key in row and row[answer_key]:
                                answers[lang] = row[answer_key]
                            
                            # Optional fields
                            hint_key = f'hint_{lang}'
                            explanation_key = f'explanation_{lang}'
                            
                            if hint_key in row and row[hint_key]:
                                hints[lang] = row[hint_key]
                            
                            if explanation_key in row and row[explanation_key]:
                                explanations[lang] = row[explanation_key]
                        
                        # Get metadata
                        order = int(row.get('order', 1))
                        difficulty = row.get('difficulty', 'medium')
                        tags = row.get('tags', '').split(',') if row.get('tags') else []
                        
                        # Create default instructions if not provided
                        instructions = {}
                        for lang in languages:
                            if lang == 'en':
                                instructions[lang] = "Select the correct answer to fill in the blank."
                            elif lang == 'fr':
                                instructions[lang] = "Sélectionnez la bonne réponse pour compléter la phrase."
                            elif lang == 'es':
                                instructions[lang] = "Selecciona la respuesta correcta para completar el espacio en blanco."
                            elif lang == 'nl':
                                instructions[lang] = "Selecteer het juiste antwoord om de zin aan te vullen."
                            else:
                                instructions[lang] = "Select the correct answer."
                        
                        # Create or update exercise
                        exercise, created = FillBlankExercise.objects.update_or_create(
                            content_lesson=content_lesson,
                            order=order,
                            defaults={
                                'sentences': sentences,
                                'answer_options': options,
                                'correct_answers': answers,
                                'difficulty': difficulty,
                                'hints': hints or None,
                                'explanations': explanations or None,
                                'instructions': instructions,
                                'tags': tags
                            }
                        )
                        
                        exercises_created.append(exercise)
                    except Exception as e:
                        errors.append(f"Row {i}: {str(e)}")
                
                # Show results
                if exercises_created:
                    messages.success(
                        request, 
                        f"Successfully imported {len(exercises_created)} exercises for lesson '{content_lesson.title_en}'"
                    )
                
                if errors:
                    messages.warning(
                        request, 
                        f"{len(errors)} errors during import: {', '.join(errors[:5])}" +
                        (f"... and {len(errors) - 5} more" if len(errors) > 5 else "")
                    )
                
                # Redirect to list view
                return redirect('admin:course_fillblankexercise_changelist')
                
            except Exception as e:
                messages.error(request, f"Error during import: {str(e)}")
        
        # Add sample CSV data to context
        context['sample_csv'] = self._get_sample_csv()
        
        return TemplateResponse(request, "admin/fillblankexercise/import_csv.html", context)
    
    def export_template_view(self, request):
        """Export a CSV template for importing exercises"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="fill_blank_template.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'order', 'difficulty', 'tags',
            'sentence_en', 'options_en', 'answer_en', 'hint_en', 'explanation_en',
            'sentence_fr', 'options_fr', 'answer_fr', 'hint_fr', 'explanation_fr',
            'sentence_es', 'options_es', 'answer_es', 'hint_es', 'explanation_es',
            'sentence_nl', 'options_nl', 'answer_nl', 'hint_nl', 'explanation_nl'
        ])
        
        # Add sample row
        writer.writerow([
            '1', 'medium', 'grammar,article,beginner',
            'Paris is ___ in France.', 'located,situated,found,placed', 'located', 'Think about position', 'We use "located" to describe the position of a place',
            'Paris est ___ en France.', 'situé,localisé,placé,trouvé', 'situé', 'Pensez à la position', 'Nous utilisons "situé" pour décrire la position d\'un lieu',
            'París está ___ en Francia.', 'ubicado,situado,localizado,encontrado', 'ubicado', 'Piensa en la posición', 'Usamos "ubicado" para describir la posición de un lugar',
            'Parijs is ___ in Frankrijk.', 'gelegen,gesitueerd,geplaatst,gevonden', 'gelegen', 'Denk aan positie', 'We gebruiken "gelegen" om de positie van een plaats te beschrijven'
        ])
        
        return response
    
    def bulk_create_view(self, request):
        """View for creating multiple exercises at once"""
        context = {
            **self.admin_site.each_context(request),
            'opts': self.model._meta,
            'title': 'Bulk Create Fill in the Blank Exercises',
            'content_lessons': ContentLesson.objects.select_related('lesson__unit').order_by(
                'lesson__unit__level', 'lesson__unit__order', 'lesson__order', 'order'
            ),
        }
        
        if request.method == 'POST':
            content_lesson_id = request.POST.get('content_lesson')
            bulk_data = request.POST.get('bulk_data', '')
            
            if not content_lesson_id:
                messages.error(request, "No content lesson selected")
                return TemplateResponse(request, "admin/fillblankexercise/bulk_create.html", context)
            
            if not bulk_data.strip():
                messages.error(request, "No data provided")
                return TemplateResponse(request, "admin/fillblankexercise/bulk_create.html", context)
            
            try:
                content_lesson = ContentLesson.objects.get(id=content_lesson_id)
                
                # Process bulk data (one exercise per paragraph)
                exercises_created = []
                errors = []
                
                # Split into paragraphs
                paragraphs = [p.strip() for p in bulk_data.split('\n\n') if p.strip()]
                
                for i, paragraph in enumerate(paragraphs, 1):
                    try:
                        lines = [line.strip() for line in paragraph.split('\n') if line.strip()]
                        
                        if len(lines) < 3:  # Need at least sentence, options and answer
                            errors.append(f"Paragraph {i}: Not enough data (need at least sentence, options, answer)")
                            continue
                        
                        # Parse data (simple format)
                        sentence = lines[0]
                        options = [opt.strip() for opt in lines[1].split(',')]
                        answer = lines[2]
                        
                        # Optional hint and explanation
                        hint = lines[3] if len(lines) > 3 else None
                        explanation = lines[4] if len(lines) > 4 else None
                        
                        # Create exercise (English only in this simple implementation)
                        # In a real implementation, you'd handle multiple languages
                        exercise = FillBlankExercise.objects.create(
                            content_lesson=content_lesson,
                            order=i,
                            difficulty='medium',
                            instructions={'en': 'Select the correct answer to fill in the blank.'},
                            sentences={'en': sentence},
                            answer_options={'en': options},
                            correct_answers={'en': answer}
                        )
                        
                        if hint:
                            exercise.hints = {'en': hint}
                            
                        if explanation:
                            exercise.explanations = {'en': explanation}
                            
                        exercise.save()
                        exercises_created.append(exercise)
                        
                    except Exception as e:
                        errors.append(f"Paragraph {i}: {str(e)}")
                
                # Show results
                if exercises_created:
                    messages.success(
                        request, 
                        f"Successfully created {len(exercises_created)} exercises for lesson '{content_lesson.title_en}'"
                    )
                
                if errors:
                    messages.warning(
                        request, 
                        f"{len(errors)} errors during creation: {', '.join(errors[:5])}" +
                        (f"... and {len(errors) - 5} more" if len(errors) > 5 else "")
                    )
                
                # Redirect to list view
                return redirect('admin:course_fillblankexercise_changelist')
                
            except Exception as e:
                messages.error(request, f"Error creating exercises: {str(e)}")
        
        # Add sample bulk data to context
        context['sample_data'] = "Paris is ___ in France.\nlocated,situated,found,placed\nlocated\nThink about position\nWe use 'located' to describe the position of a place\n\nThe weather ___ very nice today.\nis,are,were,have been\nis\nConsider singular/plural\n'Weather' is a singular noun so we use 'is'"
        
        return TemplateResponse(request, "admin/fillblankexercise/bulk_create.html", context)
    
    def preview_view(self, request, pk):
        """Standalone preview view for an exercise"""
        try:
            exercise = FillBlankExercise.objects.get(pk=pk)
        except FillBlankExercise.DoesNotExist:
            messages.error(request, "Exercise not found")
            return redirect('admin:course_fillblankexercise_changelist')
        
        context = {
            **self.admin_site.each_context(request),
            'opts': self.model._meta,
            'title': f'Preview Exercise #{pk}',
            'exercise': exercise,
            'languages': exercise.get_available_languages(),
        }
        
        return TemplateResponse(request, "admin/fillblankexercise/preview.html", context)
    
    def _extract_languages_from_headers(self, headers):
        """Extract language codes from CSV headers"""
        languages = set()
        
        for header in headers:
            if header.startswith(('sentence_', 'options_', 'answer_')):
                parts = header.split('_')
                if len(parts) >= 2:
                    lang = parts[1]
                    languages.add(lang)
        
        return languages
    
    def _validate_csv_row(self, row, languages):
        """Validate CSV row has required data for at least one language"""
        for lang in languages:
            sentence_key = f'sentence_{lang}'
            options_key = f'options_{lang}'
            answer_key = f'answer_{lang}'
            
            if (sentence_key in row and row[sentence_key] and
                options_key in row and row[options_key] and
                answer_key in row and row[answer_key]):
                return True
        
        return False
    
    def _get_sample_csv(self):
        """Generate sample CSV data"""
        return (
            "order,difficulty,tags,sentence_en,options_en,answer_en,hint_en,explanation_en\n"
            "1,easy,grammar,She ___ to school every day.,goes,walks,runs,drives,goes,Think about regular actions,We use 'goes' for regular actions\n"
            "2,medium,prepositions,The book is ___ the table.,on,in,at,under,on,Think about position,We use 'on' when something is supported by a surface"
        )
    
    # Add the export template button to the change list
    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['show_export_template_button'] = True
        extra_context['show_bulk_create_button'] = True
        return super().changelist_view(request, extra_context=extra_context)
    
    class Media:
        css = {
            'all': ('css/json_prettify.css',)
        }
        js = ('js/json_prettify.js',)