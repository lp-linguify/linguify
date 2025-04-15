# backend/progress/models/progress_base.py
from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings

STATUS_CHOICES = [
    ('not_started', 'Not started'),
    ('in_progress', 'In progress'),
    ('completed', 'Completed'),
]

class BaseProgress(models.Model):
    """
    Base abstract model for all progress tracking.
    This serves as the foundation for all progress-related models.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='%(class)s')
    language_code = models.CharField(max_length=10, default='en')  # Nouveau champ pour la langue
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_started')
    completion_percentage = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=0
    )
    score = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)], default=0)
    time_spent = models.IntegerField(validators=[MinValueValidator(0)], default=0, help_text="Time spent in seconds")
    last_accessed = models.DateTimeField(auto_now=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        abstract = True
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['user', 'language_code']),  # Nouvel index
        ]

    def mark_started(self):
        """Mark this item as started"""
        if self.status == 'not_started':
            self.status = 'in_progress'
            self.started_at = timezone.now()
            self.save()

    def mark_completed(self, score=None):
        """Mark this item as completed"""
        self.status = 'completed'
        self.completion_percentage = 100
        self.completed_at = timezone.now()
        if score is not None:
            self.score = score
        self.save()

    def update_progress(self, completion_percentage, score=None, time_spent=None):
        """Update progress of this item"""
        if completion_percentage > self.completion_percentage:
            self.completion_percentage = completion_percentage
        
        if score is not None:
            self.score = max(self.score, score)  # Keep highest score
            
        if time_spent is not None:
            self.time_spent += time_spent
            
        if self.completion_percentage >= 100:
            self.status = 'completed'
            self.completed_at = timezone.now()
        elif self.completion_percentage > 0:
            self.status = 'in_progress'
            if not self.started_at:
                self.started_at = timezone.now()
        
        self.save()