# backend/revision/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FlashcardDeckViewSet, 
    FlashcardViewSet, 
    FlashcardImportView,
    PublicDecksViewSet,
    RevisionSessionViewSet, 
    VocabularyWordViewSet, 
    VocabularyListViewSet, 
    CreateRevisionListViewSet
)
app_name = 'revision'

router = DefaultRouter()
# View for the Flashcard App
router.register(r'decks', FlashcardDeckViewSet, basename='deck')
router.register(r'flashcards', FlashcardViewSet, basename='flashcard')
router.register(r'public', PublicDecksViewSet, basename='public-deck')


router.register(r'revision-sessions', RevisionSessionViewSet, basename='revision-session')
router.register(r'vocabulary', VocabularyWordViewSet, basename='vocabulary-word')
router.register(r'vocabulary-lists', VocabularyListViewSet, basename='vocabulary-list')
router.register(r'revision-lists', CreateRevisionListViewSet, basename='revision-list')

urlpatterns = [
    path('', include(router.urls)),
    path('decks/<int:deck_id>/import/', FlashcardImportView.as_view(), name='flashcard-import'),
]


