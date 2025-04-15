# flashcard/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.urls import app_name

from .views import DeckViewSet, TagViewSet, CardViewSet, UserFlashcardProgressViewSet

app_name = 'flashcard'

router = DefaultRouter()
router.register(r'decks', DeckViewSet, basename='deck')
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'cards', CardViewSet, basename='card')
router.register(r'progress', UserFlashcardProgressViewSet, basename='progress')

urlpatterns = [
    path('', include(router.urls)),
]
