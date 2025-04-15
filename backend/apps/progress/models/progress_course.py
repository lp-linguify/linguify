# backend/progress/models/progress_course.py
from .progress_base import BaseProgress
from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from course.models import Unit, Lesson

class UserCourseProgress(BaseProgress):
    """Track user progress in courses"""
    # Generic relation to allow linking to any course-related model
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Additional course-specific fields
    xp_earned = models.PositiveIntegerField(default=0, help_text="Experience points earned")
    
    class Meta:
        unique_together = ('user', 'content_type', 'object_id', 'language_code')
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['user', 'language_code']),  # Nouvel index
        ]
        verbose_name = "Course Progress"
        verbose_name_plural = "Course Progress"

    def __str__(self):
        return f"{self.user.username} - {self.content_object} - {self.language_code} - {self.status} - {self.completion_percentage}%"

class UserLessonProgress(BaseProgress):
    """Track user progress in individual lessons"""
    lesson = models.ForeignKey('course.Lesson', on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ('user', 'lesson', 'language_code') 
        indexes = [
            models.Index(fields=['user', 'status', 'language_code']),
            models.Index(fields=['user', 'lesson', 'language_code']),
        ]
        verbose_name = "Lesson Progress"
        verbose_name_plural = "Lesson Progress"

    def __str__(self):
        return f"{self.user.username} - {self.lesson.title_en} - {self.language_code} - {self.status} - {self.completion_percentage}%"


class UserUnitProgress(BaseProgress):
    """Track user progress in course units"""
    unit = models.ForeignKey('course.Unit', on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ('user', 'unit', 'language_code')
        indexes = [
            models.Index(fields=['user', 'status', 'language_code']),
        ]
        verbose_name = "Unit Progress"
        verbose_name_plural = "Unit Progress"

    def __str__(self):
        return f"{self.user.username} - {self.unit.title_en} - {self.language_code} - {self.status} - {self.completion_percentage}%"
        
    def update_progress(self, language_code=None):
        """Calculate unit progress based on associated lesson progress"""
        from course.models import Lesson
        
        language_code = language_code or self.language_code
        
        lessons = Lesson.objects.filter(unit=self.unit)
        lesson_count = lessons.count()
        
        if lesson_count == 0:
            return
            
        user_lesson_progress = UserLessonProgress.objects.filter(
            user=self.user,
            lesson__in=lessons,
            language_code=language_code   
        )
        
        completed_lessons = user_lesson_progress.filter(status='completed').count()
        in_progress_lessons = user_lesson_progress.filter(status='in_progress').count()
        
        # Calculate overall percentage
        if completed_lessons == lesson_count:
            self.status = 'completed'
            self.completion_percentage = 100
            if not self.completed_at:
                self.completed_at = timezone.now()
        elif completed_lessons > 0 or in_progress_lessons > 0:
            self.status = 'in_progress'
            if not self.started_at:
                self.started_at = timezone.now()
                
            # Calculate completion percentage based on lesson progress
            total_percentage = sum(
                progress.completion_percentage for progress in user_lesson_progress
            )
            self.completion_percentage = total_percentage // lesson_count if lesson_count > 0 else 0
            
            # Calculate average score
            completed_with_scores = user_lesson_progress.filter(status='completed').exclude(score=0)
            if completed_with_scores.exists():
                self.score = sum(p.score for p in completed_with_scores) // completed_with_scores.count()
            
            # Sum time spent across all lessons
            self.time_spent = sum(p.time_spent for p in user_lesson_progress)
        
        self.save()

class UserContentLessonProgress(BaseProgress):
    """Track user progress in content lessons"""
    content_lesson = models.ForeignKey('course.ContentLesson', on_delete=models.CASCADE)

    class Meta:
        unique_together = ('user', 'content_lesson', 'language_code')  # Ajout de language_code
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['user', 'language_code']),  # Nouvel index
        ]
        verbose_name = "Content Lesson Progress"
        verbose_name_plural = "Content Lesson Progress"

    def __str__(self):
        return f"{self.user.username} - {self.content_lesson.title_en} - {self.language_code} - {self.status} - {self.completion_percentage}%"