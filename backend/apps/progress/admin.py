# backend/apps/progress/admin.py

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models.progress_course import (
    UserCourseProgress, 
    UserLessonProgress, 
    UserUnitProgress,
    UserContentLessonProgress
)


class CompletionPercentageFilter(admin.SimpleListFilter):
    title = 'Completion Percentage'
    parameter_name = 'completion_percentage'

    def lookups(self, request, model_admin):
        return [
            ('0-25', '0-25%'),
            ('25-50', '25-50%'),
            ('50-75', '50-75%'),
            ('75-99', '75-99%'),
            ('100', 'Completed (100%)')
        ]

    def queryset(self, request, queryset):
        value = self.value()
        if value == '0-25':
            return queryset.filter(completion_percentage__lte=25)
        elif value == '25-50':
            return queryset.filter(completion_percentage__gt=25, completion_percentage__lte=50)
        elif value == '50-75':
            return queryset.filter(completion_percentage__gt=50, completion_percentage__lte=75)
        elif value == '75-99':
            return queryset.filter(completion_percentage__gt=75, completion_percentage__lt=100)
        elif value == '100':
            return queryset.filter(completion_percentage=100)
        return queryset


@admin.register(UserCourseProgress)
class UserCourseProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'content_type', 'content_object_title', 'language_code', 'status_display', 'completion_percentage', 'xp_earned', 'last_accessed')
    list_filter = ('status', 'language_code', 'content_type', CompletionPercentageFilter)
    search_fields = ('user__username', 'user__email', 'language_code')
    readonly_fields = ('last_accessed', 'started_at', 'completed_at')
    list_per_page = 200
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'content_type')
    
    def content_object_title(self, obj):
        if not obj.content_object:
            return '-'
        
        if hasattr(obj.content_object, 'title_en'):
            return obj.content_object.title_en
        elif hasattr(obj.content_object, 'name'):
            return obj.content_object.name
        else:
            return f"Object #{obj.object_id}"
    content_object_title.short_description = 'Content Title'
    
    def status_display(self, obj):
        colors = {
            'not_started': '#dc3545',
            'in_progress': '#fd7e14',
            'completed': '#198754'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: white; background-color: {}; padding: 2px 6px; border-radius: 4px;">{}</span>', 
            color, 
            obj.status.replace('_', ' ').title()
        )
    status_display.short_description = 'Status'


@admin.register(UserLessonProgress)
class UserLessonProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'lesson_info', 'language_code', 'status_display', 'completion_percentage', 'score', 'time_display', 'last_accessed')
    list_filter = ('status', 'language_code', 'lesson__unit__level', CompletionPercentageFilter)
    search_fields = ('user__username', 'user__email', 'lesson__title_en', 'language_code')
    readonly_fields = ('last_accessed', 'started_at', 'completed_at')
    list_per_page = 200
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'lesson', 'lesson__unit')
    
    def lesson_info(self, obj):
        lesson = obj.lesson
        return f"{lesson.title_en} (Unit: {lesson.unit.level} - {lesson.unit.title_en})"
    lesson_info.short_description = 'Lesson'
    
    def status_display(self, obj):
        colors = {
            'not_started': '#dc3545',
            'in_progress': '#fd7e14',
            'completed': '#198754'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: white; background-color: {}; padding: 2px 6px; border-radius: 4px;">{}</span>', 
            color, 
            obj.status.replace('_', ' ').title()
        )
    status_display.short_description = 'Status'
    
    def time_display(self, obj):
        minutes, seconds = divmod(obj.time_spent, 60)
        hours, minutes = divmod(minutes, 60)
        
        if hours > 0:
            return f"{hours}h {minutes}m {seconds}s"
        elif minutes > 0:
            return f"{minutes}m {seconds}s"
        else:
            return f"{seconds}s"
    time_display.short_description = 'Time Spent'


@admin.register(UserUnitProgress)
class UserUnitProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'unit_info', 'language_code', 'status_display', 'completion_percentage', 'score', 'time_display', 'last_accessed')
    list_filter = ('status', 'language_code', 'unit__level', CompletionPercentageFilter)
    search_fields = ('user__username', 'user__email', 'unit__title_en', 'language_code')
    readonly_fields = ('last_accessed', 'started_at', 'completed_at')
    list_per_page = 200
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'unit')
    
    def unit_info(self, obj):
        unit = obj.unit
        return f"{unit.title_en} [{unit.level}]"
    unit_info.short_description = 'Unit'
    
    def status_display(self, obj):
        colors = {
            'not_started': '#dc3545',
            'in_progress': '#fd7e14',
            'completed': '#198754'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: white; background-color: {}; padding: 2px 6px; border-radius: 4px;">{}</span>', 
            color, 
            obj.status.replace('_', ' ').title()
        )
    status_display.short_description = 'Status'
    
    def time_display(self, obj):
        minutes, seconds = divmod(obj.time_spent, 60)
        hours, minutes = divmod(minutes, 60)
        
        if hours > 0:
            return f"{hours}h {minutes}m {seconds}s"
        elif minutes > 0:
            return f"{minutes}m {seconds}s"
        else:
            return f"{seconds}s"
    time_display.short_description = 'Time Spent'


@admin.register(UserContentLessonProgress)
class UserContentLessonProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'content_lesson_info', 'language_code', 'status_display', 'completion_percentage', 'score', 'time_display', 'last_accessed')
    list_filter = ('status', 'language_code', 'content_lesson__content_type', CompletionPercentageFilter)
    search_fields = ('user__username', 'user__email', 'content_lesson__title_en', 'language_code')
    readonly_fields = ('last_accessed', 'started_at', 'completed_at')
    list_per_page = 200
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'content_lesson', 'content_lesson__lesson', 'content_lesson__lesson__unit')
    
    def content_lesson_info(self, obj):
        content_lesson = obj.content_lesson
        return f"{content_lesson.title_en} ({content_lesson.content_type}) - Lesson: {content_lesson.lesson.title_en}"
    content_lesson_info.short_description = 'Content Lesson'
    
    def status_display(self, obj):
        colors = {
            'not_started': '#dc3545',
            'in_progress': '#fd7e14',
            'completed': '#198754'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: white; background-color: {}; padding: 2px 6px; border-radius: 4px;">{}</span>', 
            color, 
            obj.status.replace('_', ' ').title()
        )
    status_display.short_description = 'Status'
    
    def time_display(self, obj):
        minutes, seconds = divmod(obj.time_spent, 60)
        hours, minutes = divmod(minutes, 60)
        
        if hours > 0:
            return f"{hours}h {minutes}m {seconds}s"
        elif minutes > 0:
            return f"{minutes}m {seconds}s"
        else:
            return f"{seconds}s"
    time_display.short_description = 'Time Spent'