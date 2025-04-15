# backend/notebook/models.py
from django.db import models
from authentication.models import User
from django.conf import settings

class NoteCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='note_categories')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, blank=True, null=True, related_name='subcategories')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']
        unique_together = ['name', 'user', 'parent']

    def __str__(self):
        return self.name
    
# Modèle pour les étiquettes (tags) des notes  
class Tag(models.Model):
    name = models.CharField(max_length=50)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    color = models.CharField(max_length=7, default="#3B82F6")  # Couleur en format hexadécimal

    class Meta:
        unique_together = ['name', 'user']

    def __str__(self):
        return self.name

class Note(models.Model):
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
    ]
    TYPE_CHOICES = [
        ('NOTE', 'Note'),
        ('TASK', 'Task'),
        ('REMINDER', 'Reminder'),
        ('MEETING', 'Meeting'),
        ('IDEA', 'Idea'),
        ('PROJECT', 'Project'),
        ('VOCABULARY', 'Vocabulary'),
        ('GRAMMAR', 'Grammar'),
        ('EXPRESSION', 'Expression'),
        ('CULTURE', 'Culture'),
        ('EVENT', 'Event'),
        ('TEXT', 'Text'),
        ('IMAGE', 'Image'),
        ('VIDEO', 'Video')
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    title = models.CharField(max_length=255)
    content = models.TextField()
    category = models.ForeignKey(NoteCategory, on_delete=models.SET_NULL, blank=True, null=True)
    tags = models.ManyToManyField(Tag, blank=True)
    note_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='NOTE')

    # Metadata fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_reviewed_at = models.DateTimeField(auto_now=True, blank=True)
    review_count = models.IntegerField(default=0)

    # organization fields
    is_pinned = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')

    class Meta:
        ordering = ['-is_pinned', '-updated_at', '-created_at'] # Pinned notes first, then by updated_at, then by created_at
        indexes = [
            models.Index(fields=['user', 'category']),
            models.Index(fields=['-updated_at']),
        ]

    def __str__(self):
        return self.title
    
    def mark_reviewed(self):
        from django.utils import timezone
        self.last_reviewed_at = timezone.now()
        self.review_count += 1
        self.save()

    @property
    def needs_review(self):
        """Détermine si la note doit être révisée basé sur la dernière révision"""
        if not self.last_reviewed_at:
            return True
        
        from django.utils import timezone
        from datetime import timedelta
        
        # Intervalle de révision basé sur le nombre de révisions
        intervals = {
            0: timedelta(days=1),
            1: timedelta(days=3),
            2: timedelta(days=7),
            3: timedelta(days=14),
            4: timedelta(days=30),
            5: timedelta(days=60)
        }
        
        review_level = min(self.review_count, 5)
        return timezone.now() > (self.last_reviewed_at + intervals[review_level])
    
class SharedNote(models.Model):
    """Modèle pour le partage de notes entre utilisateurs"""
    note = models.ForeignKey(Note, on_delete=models.CASCADE)
    shared_with = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shared_notes')
    shared_at = models.DateTimeField(auto_now_add=True)
    can_edit = models.BooleanField(default=False)

    class Meta:
        unique_together = ['note', 'shared_with']

    def __str__(self):
        return f"{self.note.title} shared with {self.shared_with.username}"