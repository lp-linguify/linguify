from django.db import models
from django.conf import settings
from django.utils import timezone
from .revision_flashcard import Flashcard

class RevisionSession(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('MISSED', 'Missed'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    flashcards = models.ManyToManyField(Flashcard, related_name='revision_sessions')
    scheduled_date = models.DateTimeField()
    completed_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    success_rate = models.FloatField(null=True, blank=True)
    
    class Meta:
        ordering = ['scheduled_date']

    def __str__(self):
        return f"Session for {self.user.username} on {self.scheduled_date}"

    def mark_completed(self, success_rate):
        self.status = 'COMPLETED'
        self.completed_date = timezone.now()
        self.success_rate = success_rate
        self.save()

    def check_overdue(self):
        if self.status == 'PENDING' and self.scheduled_date < timezone.now():
            self.status = 'MISSED'
            self.save()