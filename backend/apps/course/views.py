# course/views.py
from rest_framework import status, viewsets, serializers
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status, filters, generics
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action, api_view
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.exceptions import ValidationError
from rest_framework.authentication import TokenAuthentication

from django_filters.rest_framework import DjangoFilterBackend
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404
from django.conf import settings


from .models import (
    Unit, 
    Lesson, 
    ContentLesson, 
    TheoryContent,
    VocabularyList, 
    MultipleChoiceQuestion, 
    Numbers,
    MatchingExercise,
    ExerciseGrammarReordering,
    FillBlankExercise,
    SpeakingExercise
)
from .serializers import (
    TargetLanguageMixin,
    UnitSerializer, 
    LessonSerializer, 
    ContentLessonSerializer, 
    VocabularyListSerializer, 
    ContentLessonDetailSerializer, 
    MultipleChoiceQuestionSerializer, 
    NumbersSerializer, 
    MatchingExerciseSerializer,
    TheoryContentSerializer,
    ExerciseGrammarReorderingSerializer,
    FillBlankExerciseSerializer,
    SpeakingExerciseSerializer
)
from .filters import LessonFilter, VocabularyListFilter
from authentication.models import User
import random
import django_filters
from django.db import models


import logging

logger = logging.getLogger(__name__)

class CustomPagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data
        })

class UnitAPIView(TargetLanguageMixin, generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = UnitSerializer
    
    def get_queryset(self):
        queryset = Unit.objects.all().order_by('order')
        
        # Filtrer par niveau si spécifié
        level = self.request.query_params.get('level')
        if level:
            queryset = queryset.filter(level=level)
            
        return queryset

class LessonAPIView(TargetLanguageMixin, generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = LessonSerializer

    def get_queryset(self):
        unit_id = self.request.query_params.get('unit')
        # Log pour debugger
        target_language = self.get_target_language()
        logger.info(f"LessonAPIView - Fetching lessons with language: {target_language}")
        
        if unit_id:
            try:
                return Lesson.objects.filter(unit_id=unit_id).order_by('order')
            except ValueError:
                raise ValidationError({"error": "Invalid unit ID"})
        return Lesson.objects.all().order_by('order')
    
    # Méthode explicite pour s'assurer que le contexte contient la langue cible
    def get_serializer_context(self):
        context = super().get_serializer_context()
        target_language = self.get_target_language()
        context['target_language'] = target_language
        logger.info(f"LessonAPIView - Adding target_language to context: {target_language}")
        return context

class ContentLessonViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = ContentLessonSerializer

    def get_queryset(self):
        lesson_id = self.request.query_params.get('lesson')
        queryset = ContentLesson.objects.all().order_by('order')
        if lesson_id:
            try:
                return queryset.filter(lesson_id=lesson_id).order_by('order')
            except ValueError:
                raise ValidationError({"error": "Invalid lesson ID"})
        return queryset.order_by('order')
    
    def get_serializer_context(self):
        """Assure que la langue cible est dans le contexte"""
        context = super().get_serializer_context()
        
        # Log pour débugger
        logger.info(f"ContentLessonViewSet Headers: {self.request.headers}")
        logger.info(f"ContentLessonViewSet Query params: {self.request.query_params}")
        
        # Priorité 1: paramètre de requête
        target_language = self.request.query_params.get('target_language')
        
        # Priorité 2: header Accept-Language 
        if not target_language and 'Accept-Language' in self.request.headers:
            accept_lang = self.request.headers['Accept-Language'].split(',')[0].split('-')[0]
            if accept_lang in ['en', 'fr', 'es', 'nl']:
                target_language = accept_lang
                logger.info(f"ContentLessonViewSet - Langue depuis Accept-Language: {target_language}")
        
        # Priorité 3: utilisateur authentifié
        if not target_language and hasattr(self.request, 'user') and self.request.user.is_authenticated:
            target_language = getattr(self.request.user, 'target_language', 'en').lower()
            logger.info(f"ContentLessonViewSet - Langue depuis profil: {target_language}")
        
        # Valeur par défaut
        if not target_language:
            target_language = 'en'
            
        logger.info(f"ContentLessonViewSet - Langue finale: {target_language}")
        context['target_language'] = target_language
        return context
        
    def list(self, request, *args, **kwargs):
        logger.info(f"ContentLessonViewSet.list - Paramètres: {request.query_params}")
        
        queryset = self.get_queryset()
        logger.info(f"ContentLessonViewSet - Trouvé {queryset.count()} contenus")
        
        context = self.get_serializer_context()
        serializer = self.get_serializer(queryset, many=True, context=context)
        
        # Log d'exemple pour vérification
        if serializer.data:
            logger.info(f"ContentLessonViewSet - Exemple de réponse: {serializer.data[0]}")
            
        return Response(serializer.data)

class TheoryContentViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    authentication_classes = []
    queryset = TheoryContent.objects.select_related('content_lesson').all()
    serializer_class = TheoryContentSerializer

    def get_queryset(self):
        """
        Optionally filters the theories by content_lesson
        """
        queryset = super().get_queryset()
        content_lesson_id = self.request.query_params.get('content_lesson', None)
        
        if content_lesson_id is not None:
            queryset = queryset.filter(content_lesson_id=content_lesson_id)
        return queryset


    @action(detail=False, methods=['GET'], url_path='by-lesson/(?P<lesson_id>[^/.]+)')
    def by_lesson(self, request, lesson_id=None):
        """
        Retrieve theory content by lesson ID
        """
        try:
            # Vérifier d'abord si le ContentLesson existe et est de type 'theory'
            content_lesson = get_object_or_404(
                ContentLesson, 
                id=lesson_id,
                content_type='theory'
            )
            
            # Récupérer la théorie associée
            theory = get_object_or_404(
                TheoryContent,
                content_lesson=content_lesson
            )
            
            serializer = self.get_serializer(theory)
            return Response(serializer.data)
        
        except ContentLesson.DoesNotExist:
            return Response(
                {"error": "Theory lesson not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except TheoryContent.DoesNotExist:
            return Response(
                {"error": "Theory content not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )


    def create(self, request, *args, **kwargs):
        """
        Créer un nouveau contenu théorique
        Vérifie que le content_lesson est de type 'theory'
        """
        content_lesson_id = request.data.get('content_lesson')
        try:
            content_lesson = ContentLesson.objects.get(
                id=content_lesson_id,
                content_type='theory'
            )
        except ContentLesson.DoesNotExist:
            return Response(
                {"error": "Invalid content lesson or not a theory type"},
                status=status.HTTP_400_BAD_REQUEST
            )

        return super().create(request, *args, **kwargs)


    def update(self, request, *args, **kwargs):
        """
        Mettre à jour un contenu théorique existant
        Vérifie que le content_lesson est de type 'theory' si modifié
        """
        content_lesson_id = request.data.get('content_lesson')
        if content_lesson_id:
            try:
                content_lesson = ContentLesson.objects.get(
                    id=content_lesson_id,
                    content_type='theory'
                )
            except ContentLesson.DoesNotExist:
                return Response(
                    {"error": "Invalid content lesson or not a theory type"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return super().update(request, *args, **kwargs)
    
class VocabularyListFilter(django_filters.FilterSet):
    content_lesson = django_filters.NumberFilter(field_name='content_lesson')

    class Meta:
        model = VocabularyList
        fields = ['content_lesson']

class VocabularyListAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = VocabularyListSerializer
    pagination_class = CustomPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = VocabularyListFilter
    search_fields = ['word_en', 'word_fr', 'word_es', 'word_nl']
    ordering_fields = ['word_en', 'word_fr', 'word_es', 'word_nl']

    def get_queryset(self):
        return VocabularyList.objects.all()

    def filter_queryset(self, queryset):
        for backend in self.filter_backends:
            queryset = backend().filter_queryset(self.request, queryset, self)
        return queryset

    def get_serializer_context(self):
        context = {
            'request': self.request,
            'format': self.format_kwarg,
            'view': self
        }
        user = self.request.user
        context['target_language'] = self.request.query_params.get(
            'target_language', 
            getattr(user, 'target_language', 'en')
        )
        return context

    def get(self, request):
        queryset = self.get_queryset()
        filtered_queryset = self.filter_queryset(queryset)
        
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(filtered_queryset, request)
        
        serializer = self.serializer_class(
            page, 
            many=True, 
            context=self.get_serializer_context()
        )
        
        return paginator.get_paginated_response(serializer.data)

class NumbersViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = NumbersSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['content_lesson']

    def get_queryset(self):
        return Numbers.objects.all()
    
    def get(self, request):
        content_lesson = request.query_params.get('content_lesson')
        target_language = request.query_params.get('target_language', 'en')

        queryset = self.get_queryset()
        if content_lesson:
            queryset = queryset.filter(content_lesson=content_lesson)

        serializer = self.serializer_class(
            queryset,
            many=True,
            context={'target_language': target_language, 'request': request}
        )

        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def toggle_review(self, request, pk=None):
        number = self.get_object()
        number.is_reviewed = not number.is_reviewed
        number.save()
        return Response({'message': 'Number reviewed'}, status=status.HTTP_200_OK)

class MatchingExerciseViewSet(viewsets.ModelViewSet):
    """
    API pour la gestion des exercices d'association.
    
    Permet de lister, créer, modifier, supprimer et interagir avec les exercices
    d'association entre langue maternelle et langue cible. Supporte le filtrage
    par leçon, difficulté et autres paramètres.
    """
    queryset = MatchingExercise.objects.all()
    serializer_class = MatchingExerciseSerializer
    permission_classes = [AllowAny]  # Ajuster selon votre stratégie d'authentification
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['content_lesson', 'difficulty']
    search_fields = ['title_en', 'title_fr', 'title_es', 'title_nl']
    ordering_fields = ['order', 'created_at', 'updated_at']
    
    def get_serializer_context(self):
        """Ajoute la requête au contexte du sérialiseur pour accéder aux paramètres."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_queryset(self):
        """
        Filtre le queryset en fonction des paramètres de requête.
        Supporte le filtrage par leçon, unité, et difficulté.
        """
        queryset = super().get_queryset()
        
        # Filtrage par leçon
        content_lesson_id = self.request.query_params.get('content_lesson')
        if content_lesson_id:
            queryset = queryset.filter(content_lesson_id=content_lesson_id)
        
        # Filtrage par unité (relation indirecte)
        unit_id = self.request.query_params.get('unit')
        if unit_id:
            queryset = queryset.filter(content_lesson__lesson__unit_id=unit_id)
        
        return queryset
    
   
    @action(detail=True, methods=['POST'], url_path='check-answers')
    def check_answers(self, request, pk=None):
        """
        Endpoint pour vérifier les réponses soumises par l'utilisateur.
        
        Exemple de payload:
        {
            "answers": {
                "mot1": "word1",
                "mot2": "word2",
                ...
            }
        }
        
        Retourne un résultat détaillé avec score et feedback.
        """
        try:
            exercise = self.get_object()
            
            # Récupérer les langues depuis les paramètres
            native_language = request.query_params.get('native_language', 'en')
            target_language = request.query_params.get('target_language', 'fr')
            
            # Valider les langues
            supported_languages = ['en', 'fr', 'es', 'nl']
            if native_language not in supported_languages:
                native_language = 'en'
            if target_language not in supported_languages:
                target_language = 'fr'
            
            # Récupérer les réponses utilisateur
            user_answers = request.data.get('answers', {})
            if not isinstance(user_answers, dict) or not user_answers:
                return Response(
                    {"error": "Invalid or empty answers provided"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Récupérer les paires correctes
            try:
                # Entourer cette partie de try/except car c'est probablement ici que se produit l'erreur
                target_words, _, correct_pairs = exercise.get_matching_pairs(native_language, target_language)
                
                # Vérifier que des paires ont été trouvées
                if not correct_pairs:
                    return Response(
                        {"error": f"No matching pairs found for languages: {native_language} (native) and {target_language} (target)"},
                        status=status.HTTP_404_NOT_FOUND
                    )
            except Exception as e:
                # Log l'erreur pour le débogage
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error getting matching pairs: {str(e)}")
                
                return Response(
                    {"error": f"Failed to generate matching pairs: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Calculer les résultats
            correct_count = 0
            wrong_count = 0
            feedback = {}
            
            for target_word, user_translation in user_answers.items():
                expected_translation = correct_pairs.get(target_word)
                # Vérifier si le mot cible existe dans les paires correctes
                if expected_translation is None:
                    # Mot non trouvé dans les paires correctes
                    feedback[target_word] = {
                        'is_correct': False,
                        'user_answer': user_translation,
                        'correct_answer': "Unknown word",
                        'error': "Word not found in exercise"
                    }
                    wrong_count += 1
                    continue
                    
                is_correct = user_translation == expected_translation
                
                if is_correct:
                    correct_count += 1
                else:
                    wrong_count += 1
                
                feedback[target_word] = {
                    'is_correct': is_correct,
                    'user_answer': user_translation,
                    'correct_answer': expected_translation
                }
            
            # Calculer le score final
            total_count = len(correct_pairs)
            score_percentage = (correct_count / total_count * 100) if total_count > 0 else 0
            
            # Définir le seuil de réussite
            SUCCESS_THRESHOLD = 60  # 60% pour passer l'exercice
            
            # Déterminer si l'exercice est considéré comme réussi
            is_successful = score_percentage >= SUCCESS_THRESHOLD
            
            # Créer le message de résultat en fonction du score
            if score_percentage >= 90:
                message = "Excellent! Perfect match!"
            elif score_percentage >= 75:
                message = "Good job! Keep practicing to improve!"
            elif score_percentage >= SUCCESS_THRESHOLD:
                message = "Well done! You've passed this exercise."
            elif score_percentage >= 40:
                message = "You're getting there, but you need more practice to pass. Try again!"
            else:
                message = "Keep trying! You'll get better with practice."
            
            # Construire la réponse
            result = {
                'score': score_percentage,
                'message': message,
                'correct_count': correct_count,
                'wrong_count': wrong_count,
                'total_count': total_count,
                'feedback': feedback,
                'is_successful': is_successful,
                'success_threshold': SUCCESS_THRESHOLD
            }
            
            return Response(result)
            
        except Exception as e:
            # Capturer toutes les autres exceptions non prévues
            import traceback
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Unexpected error in check_answers: {str(e)}")
            logger.error(traceback.format_exc())
            
            return Response(
                {
                    "error": "An unexpected error occurred while checking answers",
                    "detail": str(e) if settings.DEBUG else "Please contact support if this issue persists."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['POST'], url_path='auto_create')
    def auto_create(self, request):
        """
        Crée automatiquement un exercice d'association à partir du vocabulaire
        d'une leçon existante.
        
        Paramètres attendus dans le corps de la requête:
        - content_lesson_id: ID de la leçon de contenu (obligatoire)
        - vocabulary_ids: Liste des IDs de vocabulaire à inclure (optionnel)
        - pairs_count: Nombre maximal de paires à inclure (optionnel, défaut=8)
        """
        content_lesson_id = request.data.get('content_lesson_id')
        if not content_lesson_id:
            return Response(
                {"error": "Le paramètre content_lesson_id est obligatoire"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Valider que la leçon existe
        try:
            content_lesson = ContentLesson.objects.get(id=content_lesson_id)
        except ContentLesson.DoesNotExist:
            return Response(
                {"error": f"La leçon de contenu avec ID {content_lesson_id} n'existe pas"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Récupérer les paramètres optionnels
        vocabulary_ids = request.data.get('vocabulary_ids')
        pairs_count = int(request.data.get('pairs_count', 8))
        
        # Déterminer les mots de vocabulaire à utiliser
        if vocabulary_ids:
            # Utiliser les IDs spécifiés
            vocabulary_items = VocabularyList.objects.filter(id__in=vocabulary_ids)
        else:
            # Utiliser tout le vocabulaire de la leçon
            vocabulary_items = VocabularyList.objects.filter(content_lesson=content_lesson)
        
        # Vérifier si du vocabulaire est disponible
        if not vocabulary_items.exists():
            return Response(
                {"error": "Aucun vocabulaire disponible pour cette leçon"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Créer l'exercice en utilisant la méthode de classe
        exercise = MatchingExercise.create_from_content_lesson(
            content_lesson=content_lesson,
            vocabulary_ids=[v.id for v in vocabulary_items[:pairs_count]],
            pairs_count=min(pairs_count, vocabulary_items.count())
        )
        
        # Sérialiser et renvoyer la réponse
        serializer = self.get_serializer(exercise)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class MultipleChoiceQuestionAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = MultipleChoiceQuestionSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['content_lesson']

    def get_queryset(self):
        return MultipleChoiceQuestion.objects.all()

    def get(self, request, *args, **kwargs):
        content_lesson = request.query_params.get('content_lesson')
        target_language = request.query_params.get('target_language', 'en')


        queryset = self.get_queryset()
        if content_lesson:
            queryset = queryset.filter(content_lesson=content_lesson)

        serializer = self.serializer_class(
            queryset,
            many=True,
            context={'target_language': target_language, 'request': request}
        )

        return Response(serializer.data)

class ExerciseGrammarReorderingViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = ExerciseGrammarReorderingSerializer
    queryset = ExerciseGrammarReordering.objects.all()

    @action(detail=False, methods=['GET'], url_path='random', url_name='random')
    def random(self, request):
        content_lesson = request.query_params.get('content_lesson')
        queryset = self.get_queryset()
        
        if content_lesson:
            queryset = queryset.filter(content_lesson=content_lesson)
        
        exercise = queryset.order_by('?').first()

        if not exercise:
            return Response(
                {
                    "error": f"No exercise available for content lesson {content_lesson}"
                },
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(exercise)
        return Response(serializer.data)

    def list(self, request, *args, **kwargs):
        content_lesson = request.query_params.get('content_lesson')
        queryset = self.get_queryset()
        
        if content_lesson:
            queryset = queryset.filter(content_lesson=content_lesson)
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class ExerciceVocabularyAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        vocab_count = VocabularyList.objects.count()
        if vocab_count == 0:
            return Response({"error": "No vocabulary available."}, status=status.HTTP_404_NOT_FOUND)

        random_word = VocabularyList.objects.order_by('?').first()
        # Récupère 3 autres mots différents
        other_words = VocabularyList.objects.exclude(pk=random_word.pk).order_by('?')[:3]
        words = list(other_words) + [random_word]
        random.shuffle(words)
        data = {
            'word': random_word.word,
            'choices': [{'id': w.id, 'word': w.word} for w in words]
        }
        return Response(data, status=status.HTTP_200_OK)

class SearchVocabularyAPIView(APIView):
    def get(self, request):
        query = request.GET.get('query', '')
        vocabulary_list = VocabularyList.objects.filter(word__icontains=query) if query else VocabularyList.objects.all()
        data = VocabularyListSerializer(vocabulary_list, many=True).data
        return Response({'query': query, 'vocabularies': data}, status=status.HTTP_200_OK)

class FillBlankExerciseFilterSet(django_filters.FilterSet):
    class Meta:
        model = FillBlankExercise
        fields = {
            'content_lesson': ['exact'],
            'difficulty': ['exact'],
            # Exclude the JSONField 'tags' from automatic filtering
            # We'll handle it manually if needed
        }
        
        # Override the filter types for JSONField
        filter_overrides = {
            models.JSONField: {
                'filter_class': django_filters.CharFilter,
                'extra': lambda f: {
                    'lookup_expr': 'icontains',
                }
            },
        }

class FillBlankExerciseViewSet(viewsets.ModelViewSet):

    """
    API pour les exercices de type "fill in the blank"
    Permet de lister, créer, récupérer, mettre à jour et supprimer des exercices
    """
    queryset = FillBlankExercise.objects.all()
    serializer_class = FillBlankExerciseSerializer
    permission_classes = [AllowAny]  
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = FillBlankExerciseFilterSet  
    search_fields = ['sentences'] 
    ordering_fields = ['order', 'created_at', 'updated_at']
    
    def get_queryset(self):
        """Personnaliser le queryset avec des filtres supplémentaires"""
        queryset = super().get_queryset()
        
        # Filtrer par leçon
        content_lesson_id = self.request.query_params.get('content_lesson')
        if content_lesson_id:
            queryset = queryset.filter(content_lesson_id=content_lesson_id)
        
        # Filtrer par langue disponible
        language = self.request.query_params.get('language') or self.request.query_params.get('target_language')
        if language:
            # Filtrer les exercices qui ont du contenu dans cette langue
            queryset = queryset.filter(sentences__has_key=language, answer_options__has_key=language)
        
        return queryset
    
    @action(detail=False, methods=['GET'], url_path='by-lesson/(?P<lesson_id>[^/.]+)')
    def by_lesson(self, request, lesson_id=None):
        """Récupère tous les exercices d'une leçon donnée"""
        try:
            # Vérifier que la leçon existe
            content_lesson = ContentLesson.objects.get(pk=lesson_id)
            
            # Récupérer les exercices de cette leçon
            exercises = self.get_queryset().filter(content_lesson=content_lesson).order_by('order')
            
            # Sérialiser les résultats
            serializer = self.get_serializer(exercises, many=True)
            
            return Response(serializer.data)
        except ContentLesson.DoesNotExist:
            return Response(
                {"error": f"Content lesson with ID {lesson_id} does not exist"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['GET'], url_path='random')
    def random(self, request):
        """Récupère un exercice aléatoire en appliquant les filtres actuels"""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Si aucun exercice ne correspond aux critères
        if not queryset.exists():
            return Response(
                {"error": "No exercises match the current filters"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Sélectionner un exercice aléatoirement
        random_exercise = queryset.order_by('?').first()
        serializer = self.get_serializer(random_exercise)
        
        return Response(serializer.data)
    
    @action(detail=True, methods=['POST'], url_path='check-answer')
    def check_answer(self, request, pk=None):
        """
        Vérifie si une réponse est correcte
        
        Attend un corps de requête au format:
        {
            "answer": "is not",
            "language": "en"  // Optionnel, utilise la langue de la requête par défaut
        }
        """
        exercise = self.get_object()
        
        # Valider les données de la requête
        if 'answer' not in request.data:
            return Response(
                {"error": "Missing 'answer' field in request body"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user_answer = request.data['answer']
        language = request.data.get('language') or self._get_target_language(request)
        
        # Vérifier la réponse
        is_correct = exercise.check_answer(user_answer, language)
        
        # Préparer la réponse
        response_data = {
            "is_correct": is_correct,
            "correct_answer": exercise.correct_answers.get(language, exercise.correct_answers.get('en', "")),
        }
        
        # Ajouter l'explication si disponible
        if exercise.explanations and language in exercise.explanations:
            response_data["explanation"] = exercise.explanations[language]
        elif exercise.explanations and 'en' in exercise.explanations:
            response_data["explanation"] = exercise.explanations['en']
        
        return Response(response_data)
    
    def _get_target_language(self, request):
        """Détermine la langue cible pour une requête"""
        # 1. Vérifier les paramètres de requête
        target_language = request.query_params.get('language') or request.query_params.get('target_language')
        if target_language:
            return target_language.lower()
        
        # 2. Vérifier l'en-tête Accept-Language
        if 'Accept-Language' in request.headers:
            accept_lang = request.headers['Accept-Language'].split(',')[0].split(';')[0].strip()
            if accept_lang and len(accept_lang) >= 2:
                return accept_lang[:2].lower()
        
        # 3. Vérifier le profil utilisateur
        if hasattr(request, 'user') and request.user.is_authenticated:
            user_language = getattr(request.user, 'target_language', None)
            if user_language:
                return user_language.lower()
        
        # 4. Valeur par défaut
        return 'en'
    
class LessonsByContentView(TargetLanguageMixin, generics.ListAPIView):

    """
    Vue API pour récupérer des leçons filtrées par type de contenu.
    
    Récupère toutes les leçons qui contiennent un type de contenu spécifique
    et enrichit les données avec les informations d'unité associées.
    """
    permission_classes = [AllowAny]
    serializer_class = LessonSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title_en', 'title_fr', 'title_es', 'title_nl']
    ordering_fields = ['order', 'unit__level', 'unit__order']
    
    def get_queryset(self):
        # Récupérer le type de contenu depuis les paramètres de requête
        content_type = self.request.query_params.get('content_type')
        
        # MODIFICATION: Ne pas lever d'exception si content_type est absent
        # Traiter l'absence comme une demande pour tous les types de contenu
        if not content_type:
            # Construire le queryset pour tous les types de contenu
            queryset = Lesson.objects.all().distinct().select_related('unit')
        else:
            # Construire le queryset filtré par type de contenu
            queryset = Lesson.objects.filter(
                content_lessons__content_type__iexact=content_type
            ).distinct().select_related('unit')
        
        # Filtrer davantage par niveau si spécifié
        level = self.request.query_params.get('level')
        if level and level != "all":
            queryset = queryset.filter(unit__level=level)
        
        # Ordonner par unité et ordre de leçon pour un affichage cohérent
        return queryset.order_by('unit__order', 'order')
    
    def get_serializer_class(self):
        """Utiliser un sérialiseur enrichi qui inclut les informations d'unité"""
        
        class EnhancedLessonSerializer(LessonSerializer):
            unit_title = serializers.SerializerMethodField()
            unit_level = serializers.SerializerMethodField()
            unit_id = serializers.IntegerField(source='unit.id')
            content_count = serializers.SerializerMethodField()
            
            class Meta(LessonSerializer.Meta):
                fields = LessonSerializer.Meta.fields + [
                    'unit_title', 'unit_level', 'unit_id', 'content_count'
                ]
            
            def get_unit_title(self, obj):
                target_language = self.context.get('target_language', 'en')
                field_name = f'title_{target_language}'
                return getattr(obj.unit, field_name, obj.unit.title_en)
            
            def get_unit_level(self, obj):
                return obj.unit.level
                
            def get_content_count(self, obj):
                """Renvoie le nombre de contenus du type demandé dans cette leçon"""
                content_type = self.context.get('request').query_params.get('content_type')
                return obj.content_lessons.filter(content_type__iexact=content_type).count()
        
        return EnhancedLessonSerializer
    
    def get_serializer_context(self):
        """
        Ajouter des informations supplémentaires au contexte pour personnaliser la sérialisation
        """
        context = super().get_serializer_context()
        context['content_type'] = self.request.query_params.get('content_type', '')
        return context
    
    def list(self, request, *args, **kwargs):
        """Personnaliser la réponse pour inclure des métadonnées utiles"""
        # Exécuter la logique de liste standard
        response = super().list(request, *args, **kwargs)
        
        # Enrichir la réponse avec des métadonnées
        content_type = request.query_params.get('content_type', '')
        target_language = self.get_target_language()
        
        # Obtenir les niveaux disponibles pour ce type de contenu
        available_levels = Lesson.objects.filter(
            content_lessons__content_type__iexact=content_type
        ).values_list('unit__level', flat=True).distinct().order_by('unit__level')
        
        # Ajouter des métadonnées à la réponse
        response.data = {
            'results': response.data,
            'metadata': {
                'content_type': content_type,
                'target_language': target_language,
                'available_levels': list(available_levels),
                'total_count': len(response.data)
            }
        }
        
        return response
    

class SpeakingExerciseViewSet(viewsets.ModelViewSet):
    queryset = SpeakingExercise.objects.all()
    serializer_class = SpeakingExerciseSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['content_lesson']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        content_lesson_id = self.request.query_params.get('content_lesson')
        if content_lesson_id:
            queryset = queryset.filter(content_lesson_id=content_lesson_id)
        return queryset
    
    @action(detail=False, methods=['GET'], url_path='vocabulary')
    def get_vocabulary(self, request):
        """
        Récupère les items de vocabulaire associés à un exercice de prononciation spécifique
        """
        content_lesson_id = request.query_params.get('content_lesson')
        if not content_lesson_id:
            return Response(
                {"error": "Le paramètre content_lesson est requis"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            # Trouver l'exercice de prononciation pour ce content_lesson
            speaking_exercise = SpeakingExercise.objects.filter(
                content_lesson_id=content_lesson_id
            ).first()
            
            if not speaking_exercise:
                return Response(
                    {"error": f"Aucun exercice de prononciation trouvé pour content_lesson {content_lesson_id}"},
                    status=status.HTTP_404_NOT_FOUND
                )
                
            # Récupérer les items de vocabulaire associés
            vocabulary_items = speaking_exercise.vocabulary_items.all()
            
            # Sérialiser les données
            target_language = self._get_target_language(request)
            serializer = VocabularyListSerializer(
                vocabulary_items, 
                many=True,
                context={'target_language': target_language, 'request': request}
            )
            
            return Response({
                "exercise_id": speaking_exercise.id,
                "content_lesson_id": int(content_lesson_id),
                "results": serializer.data
            })
            
        except Exception as e:
            return Response(
                {"error": f"Erreur lors de la récupération du vocabulaire: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    def _get_target_language(self, request):
        """Détermine la langue cible pour une requête"""
        target_language = request.query_params.get('target_language')
        if target_language:
            return target_language.lower()
            
        if 'Accept-Language' in request.headers:
            accept_lang = request.headers['Accept-Language'].split(',')[0].split(';')[0].strip()
            if accept_lang and len(accept_lang) >= 2:
                return accept_lang[:2].lower()
                
        if hasattr(request, 'user') and request.user.is_authenticated:
            user_language = getattr(request.user, 'target_language', None)
            if user_language:
                return user_language.lower()
                
        return 'en'