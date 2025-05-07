# backend/django_apps/flashcard/apps.py
from django.apps import AppConfig

class FlashcardConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.flashcard'
    label = 'flashcard'
