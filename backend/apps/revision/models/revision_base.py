# backend/django_apps/revision/models/revision_base.py

from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.db.models import signals
from django.dispatch import receiver
import random

class RevisionManager(models.Manager):
    """Manager for custom Revision methods."""

    def get_random_words(self, language, level, num_words=1):
        vocabulary_words = self.filter(language=language, level=level)
        if vocabulary_words.exists():
            return random.sample(list(vocabulary_words), num_words)
        return None

# Main Revision model
class Revision(models.Model):
    revision_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=100)
    know = models.BooleanField(default=False)
    last_reviewed = models.DateTimeField(default=timezone.now)
    word = models.CharField(max_length=100)
    translation = models.CharField(max_length=100)

    objects = RevisionManager()  # Use custom manager

    def __str__(self):
        return f"Revision of {self.word} - {self.translation}"

    class Meta:
        verbose_name = "Revision"
        verbose_name_plural = "Revisions"
        indexes = [
            models.Index(fields=['word']),
            models.Index(fields=['translation']),
        ]

# Manager for UserRevisionProgress to handle helper methods
class UserRevisionProgressManager(models.Manager):
    """Manager for UserRevisionProgress helper methods."""

    def get_user_progress(self, user, revision):
        progress, created = self.get_or_create(user=user, revision=revision)
        return progress

# Model to track user progress in revisions
class UserRevisionProgress(models.Model):
    STATUT_CHOICES = [
        ('Not started', 'Not started'),
        ('In progress', 'In progress'),
        ('Completed', 'Completed'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    revision = models.ForeignKey(Revision, on_delete=models.CASCADE)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='Not started')
    percentage_completion = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)], default=0)
    time_study = models.IntegerField(validators=[MinValueValidator(0)], default=0, help_text="Time studied in minutes")
    score_revision = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    words_succeeded = models.IntegerField(default=0)
    words_failed = models.IntegerField(default=0)
    words_to_review = models.IntegerField(default=0)

    objects = UserRevisionProgressManager()  # Use custom manager

    def __str__(self):
        return f"{self.user.username} - {self.revision.title}"

    # Methods to manage the revision process
    def start_revision(self):
        self.statut = 'In progress'
        self.save()

    def update_progress(self, succeeded=True):
        if succeeded:
            self.words_succeeded += 1
        else:
            self.words_failed += 1
            self.words_to_review += 1

        total_words = self.words_succeeded + self.words_failed
        self.percentage_completion = (self.words_succeeded / total_words) * 100 if total_words > 0 else 0
        self.save()

    def reset_progress(self):
        self.statut = 'Not started'
        self.percentage_completion = 0
        self.time_study = 0
        self.score_revision = 0
        self.words_succeeded = 0
        self.words_failed = 0
        self.words_to_review = 0
        self.save()

    def get_review_words(self, num_words=1):
        if self.words_to_review > 0:
            return Revision.objects.get_random_words(self.revision.language, self.revision.level, num_words)
        return None

    def complete_revision(self):
        self.statut = 'Completed'
        self.percentage_completion = 100
        self.save()

    def update_score(self, score):
        self.score_revision += score
        self.save()

    def update_time_study(self, time):
        self.time_study += time
        self.save()

    class Meta:
        verbose_name = "User Revision Progress"
        verbose_name_plural = "User Revision Progresses"
        indexes = [
            models.Index(fields=['user', 'revision']),
        ]

# Signal to update the last reviewed date
@receiver(signals.post_save, sender=Revision)
def update_last_reviewed(sender, instance, **kwargs):
    instance.last_reviewed = timezone.now()
    instance.save()

# Signal to ensure default values are set
@receiver(signals.pre_save, sender=UserRevisionProgress)
def ensure_default_values(sender, instance, **kwargs):
    if not instance.time_study:
        instance.time_study = 0
    if not instance.score_revision:
        instance.score_revision = 0

