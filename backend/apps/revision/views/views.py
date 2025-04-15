# revision/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from django.db.models import Q
from django.db import transaction
import pandas as pd
import logging

from revision.models import RevisionSession, VocabularyWord, VocabularyList, Flashcard
from revision.serializers import RevisionSessionSerializer, VocabularyWordSerializer, VocabularyListSerializer

logger = logging.getLogger(__name__)


class RevisionSessionViewSet(viewsets.ModelViewSet):
    serializer_class = RevisionSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RevisionSession.objects.filter(user=self.request.user)

    @transaction.atomic
    def perform_create(self, serializer):
        due_cards = Flashcard.objects.select_for_update().filter(
            deck__user=self.request.user,
            next_review__lte=timezone.now()
        )
        if not due_cards.exists():
            raise ValidationError("No cards due for review")
        
        session = serializer.save(user=self.request.user)
        session.flashcards.set(due_cards)
        return session

    @action(detail=True, methods=['post'])
    def complete_session(self, request, pk=None):
        try:
            session = self.get_object()
            if session.status == 'COMPLETED':
                return Response(
                    {'error': 'Session already completed'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            success_rate = request.data.get('success_rate')
            if not isinstance(success_rate, (int, float)) or not 0 <= success_rate <= 100:
                return Response(
                    {'error': 'Invalid success rate'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            session.mark_completed(success_rate)
            serializer = self.get_serializer(session)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error completing revision session: {str(e)}")
            return Response(
                {'error': 'Failed to complete session'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def get_schedule(self, request):
        days_before = int(request.query_params.get('days_before', 7))
        days_after = int(request.query_params.get('days_after', 30))
        
        today = timezone.now()
        sessions = self.get_queryset().filter(
            scheduled_date__range=[
                today - timezone.timedelta(days=days_before),
                today + timezone.timedelta(days=days_after)
            ]
        ).order_by('scheduled_date')
        
        serializer = self.get_serializer(sessions, many=True)
        return Response(serializer.data)

class VocabularyWordViewSet(viewsets.ModelViewSet):
    serializer_class = VocabularyWordSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        queryset = VocabularyWord.objects.filter(user=self.request.user)
        
        # Filtrage par langue
        source_lang = self.request.query_params.get('source_language')
        target_lang = self.request.query_params.get('target_language')
        if source_lang:
            queryset = queryset.filter(source_language=source_lang)
        if target_lang:
            queryset = queryset.filter(target_language=target_lang)
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def import_excel(self, request):
        if 'file' not in request.FILES:
            return Response(
                {'error': 'No file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        file = request.FILES['file']
        source_language = request.data.get('source_language')
        target_language = request.data.get('target_language')

        if not all([source_language, target_language]):
            return Response(
                {'error': 'Both source and target languages must be specified'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                if file.name.endswith('.xlsx'):
                    df = pd.read_excel(file)
                elif file.name.endswith('.csv'):
                    df = pd.read_csv(file)
                else:
                    return Response(
                        {'error': 'File must be either .xlsx or .csv'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )

                required_columns = ['word', 'translation']
                if not all(col in df.columns for col in required_columns):
                    return Response(
                        {'error': f'File must contain columns: {", ".join(required_columns)}'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )

                words_created = []
                for _, row in df.iterrows():
                    # Skip empty rows
                    if pd.isna(row['word']) or pd.isna(row['translation']):
                        continue
                        
                    word = VocabularyWord.objects.create(
                        user=request.user,
                        word=str(row['word']).strip(),
                        translation=str(row['translation']).strip(),
                        source_language=source_language,
                        target_language=target_language,
                        context=str(row.get('context', '')).strip(),
                        notes=str(row.get('notes', '')).strip()
                    )
                    words_created.append(word)

                if not words_created:
                    return Response(
                        {'error': 'No valid words found in file'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )

                serializer = VocabularyWordSerializer(words_created, many=True)
                return Response({
                    'message': f'{len(words_created)} words imported successfully',
                    'words': serializer.data
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error importing vocabulary: {str(e)}")
            return Response(
                {'error': f'Failed to import words: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def due_for_review(self, request):
        try:
            limit = int(request.query_params.get('limit', 10))
            words = self.get_queryset().filter(
                Q(last_reviewed__isnull=True) |
                Q(mastery_level__lt=5)
            ).order_by('?')[:limit]
            
            serializer = self.get_serializer(words, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error getting words due for review: {str(e)}")
            return Response(
                {'error': 'Failed to get words for review'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class VocabularyListViewSet(viewsets.ModelViewSet):
    serializer_class = VocabularyListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return VocabularyList.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def add_words(self, request, pk=None):
        try:
            vocab_list = self.get_object()
            word_ids = request.data.get('word_ids', [])
            
            if not word_ids:
                return Response(
                    {'error': 'No word IDs provided'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            words = VocabularyWord.objects.filter(
                id__in=word_ids,
                user=request.user
            )

            if not words.exists():
                return Response(
                    {'error': 'No valid words found'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            vocab_list.words.add(*words)
            serializer = self.get_serializer(vocab_list)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error adding words to vocabulary list: {str(e)}")
            return Response(
                {'error': 'Failed to add words to list'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )