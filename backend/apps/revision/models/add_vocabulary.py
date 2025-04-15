# backend/revision/models/add_vocabulary.py
from django.db import models
from django.conf import settings

class CreateRevisionList(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class AddField(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    revision_list = models.ForeignKey(CreateRevisionList, on_delete=models.CASCADE, related_name='fields')
    field_1 = models.CharField(max_length=255)
    field_2 = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    last_reviewed = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user} -> {self.field_1} -> {self.field_2}"




