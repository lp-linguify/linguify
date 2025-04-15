# revision/models/vocabulary.py
from django.db import models
from django.conf import settings
from django.utils import timezone

class VocabularyWord(models.Model):
    LANGUAGE_CHOICES = [
        ('EN', 'English'),
        ('FR', 'French'),
        ('ES', 'Spanish'),
        ('NL', 'Dutch'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    word = models.CharField(max_length=255)
    translation = models.CharField(max_length=255)
    source_language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES)
    target_language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES)
    context = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_reviewed = models.DateTimeField(null=True, blank=True)
    review_count = models.PositiveIntegerField(default=0)
    mastery_level = models.PositiveIntegerField(default=0)  # 0-5 par exemple

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'source_language', 'target_language']),
            models.Index(fields=['word']),
        ]

    def __str__(self):
        return f"{self.word} ({self.source_language}) -> {self.translation} ({self.target_language})"

    def mark_reviewed(self, success=True):
        self.last_reviewed = timezone.now()
        self.review_count += 1
        if success:
            self.mastery_level = min(5, self.mastery_level + 1)
        else:
            self.mastery_level = max(0, self.mastery_level - 1)
        self.save()

class VocabularyList(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    words = models.ManyToManyField(VocabularyWord, related_name='lists')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.user.username}"