# revision/serializers.py
from rest_framework import serializers
from ..models import RevisionSession, VocabularyWord, VocabularyList
from .flashcard_serializers import FlashcardSerializer  # Import from specific module

class RevisionSessionSerializer(serializers.ModelSerializer):
    flashcards = FlashcardSerializer(many=True, read_only=True)
    due_date = serializers.SerializerMethodField()

    class Meta:
        model = RevisionSession
        fields = ['id', 'scheduled_date', 'completed_date', 'status', 
                 'success_rate', 'flashcards', 'due_date']
        read_only_fields = ['completed_date', 'status', 'success_rate']

    def get_due_date(self, obj):
        if obj.status == 'PENDING':
            return obj.scheduled_date
        return None

class VocabularyWordSerializer(serializers.ModelSerializer):
    class Meta:
        model = VocabularyWord
        fields = ['id', 'word', 'translation', 'source_language', 'target_language', 
                 'context', 'notes', 'created_at', 'last_reviewed', 'review_count', 
                 'mastery_level']
        read_only_fields = ['created_at', 'last_reviewed', 'review_count', 'mastery_level']

    def validate(self, data):
        if not data.get('word') or not data.get('translation'):
            raise serializers.ValidationError("Both word and translation are required")
        return data

class VocabularyListSerializer(serializers.ModelSerializer):
    words = VocabularyWordSerializer(many=True, read_only=True)
    word_count = serializers.SerializerMethodField()

    class Meta:
        model = VocabularyList
        fields = ['id', 'name', 'description', 'created_at', 'updated_at', 
                 'words', 'word_count']
        read_only_fields = ['created_at', 'updated_at']

    def get_word_count(self, obj):
        return obj.words.count()