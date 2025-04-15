# backend/progress/views.py

from rest_framework import viewsets, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum
from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404

from course.models import Unit, Lesson, ContentLesson
from ..models.progress_course import (
    UserCourseProgress, 
    UserLessonProgress, 
    UserUnitProgress,
    UserContentLessonProgress
)
from ..serializers.progress_course_serializers import (
    UserLessonProgressSerializer,
    UserUnitProgressSerializer,
    ContentLessonProgressSerializer,
    UserCourseContentProgressSerializer,
    LessonProgressUpdateSerializer,
    UnitProgressUpdateSerializer,
    ContentLessonProgressUpdateSerializer
)

import logging
logger = logging.getLogger(__name__)

class UserProgressViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer toutes les progressions de l'utilisateur connecté.
    Fournit différentes actions pour récupérer et mettre à jour les progrès.
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Le queryset de base sera défini dans les sous-classes
        user = self.request.user
        logger.debug(f"User {user.username} accessing progress data")
        return None
    
    def get_serializer_class(self):
        # Le serializer sera défini dans les sous-classes
        pass
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class UserLessonProgressViewSet(UserProgressViewSet):
    """Gestion de la progression des leçons pour l'utilisateur connecté avec support multilingue"""
    
    def get_queryset(self):
        user = self.request.user
        
        # Filtrer par langue si spécifiée
        language_code = self.request.query_params.get('language_code') or self.request.query_params.get('target_language')
        
        queryset = UserLessonProgress.objects.filter(user=user)
        
        if language_code:
            queryset = queryset.filter(language_code=language_code)
        elif user.is_authenticated:
            # Utiliser la langue cible de l'utilisateur par défaut
            language_code = getattr(user, 'target_language', 'en').lower()
            queryset = queryset.filter(language_code=language_code)
            
        logger.debug(f"User {user.username} accessing lesson progress data for language {language_code}")
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'update_progress':
            return LessonProgressUpdateSerializer
        return UserLessonProgressSerializer
    
    @action(detail=False, methods=['post'])
    def update_progress(self, request):
        """Mettre à jour la progression d'une leçon spécifique"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        lesson_id = serializer.validated_data['lesson_id']
        lesson = get_object_or_404(Lesson, pk=lesson_id)
        
        # Obtenir la langue cible depuis les paramètres de requête ou le profil utilisateur
        language_code = request.data.get('language_code') or request.query_params.get('language_code') or request.query_params.get('target_language')
        if not language_code and request.user.is_authenticated:
            language_code = getattr(request.user, 'target_language', 'en')
        language_code = language_code.lower() if language_code else 'en'
        
        logger.info(f"Updating lesson progress for user {request.user.username}, lesson {lesson_id}, language {language_code}")
        
        # Récupérer ou créer l'objet de progression avec le critère de langue
        progress, created = UserLessonProgress.objects.get_or_create(
            user=request.user,
            lesson=lesson,
            language_code=language_code,
            defaults={
                'status': 'not_started',
                'completion_percentage': 0
            }
        )
        
        # Si nécessaire, marquer comme commencé
        if progress.status == 'not_started':
            progress.mark_started()
        
        # Mettre à jour les champs si présents
        if 'completion_percentage' in serializer.validated_data:
            completion_percentage = serializer.validated_data['completion_percentage']
            score = serializer.validated_data.get('score')
            time_spent = serializer.validated_data.get('time_spent')
            progress.update_progress(completion_percentage, score, time_spent)
        
        # Marquer comme terminé si demandé
        if serializer.validated_data.get('mark_completed'):
            progress.mark_completed(
                score=serializer.validated_data.get('score', progress.score)
            )
        
        # Unit Progression
        unit_progress, _ = UserUnitProgress.objects.get_or_create(
            user=request.user,
            unit=lesson.unit,
            language_code=language_code,
            defaults={
                'status': 'not_started',
                'completion_percentage': 0
            }
        )
        unit_progress.update_progress()
        
        return Response(
            UserLessonProgressSerializer(progress).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def by_unit(self, request):
        """Récupérer la progression des leçons par unité"""
        unit_id = request.query_params.get('unit_id')
        if not unit_id:
            return Response(
                {"error": "Le paramètre unit_id est requis"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Obtenir la langue cible
        language_code = request.query_params.get('language_code') or request.query_params.get('target_language')
        if not language_code and request.user.is_authenticated:
            language_code = getattr(request.user, 'target_language', 'en')
        language_code = language_code.lower() if language_code else 'en'
            
        unit = get_object_or_404(Unit, pk=unit_id)
        queryset = self.get_queryset().filter(
            lesson__unit=unit,
            language_code=language_code  # Filtrer par langue
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
        
    @action(detail=False, methods=['get'])
    def by_language(self, request):
        """Récupérer la progression des leçons par langue"""
        language_code = request.query_params.get('language_code')
        if not language_code:
            return Response(
                {"error": "Le paramètre language_code est requis"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        queryset = UserLessonProgress.objects.filter(
            user=request.user,
            language_code=language_code
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class UserUnitProgressViewSet(UserProgressViewSet):
    """Gestion de la progression des unités pour l'utilisateur connecté avec support multilingue"""
    
    def get_queryset(self):
        user = self.request.user
        
        # Filtrer par langue si spécifiée
        language_code = self.request.query_params.get('language_code') or self.request.query_params.get('target_language')
        
        queryset = UserUnitProgress.objects.filter(user=user)
        
        if language_code:
            queryset = queryset.filter(language_code=language_code)
        elif user.is_authenticated:
            # Utiliser la langue cible de l'utilisateur par défaut
            language_code = getattr(user, 'target_language', 'en').lower()
            queryset = queryset.filter(language_code=language_code)
            
        logger.debug(f"User {user.username} accessing unit progress data for language {language_code}")
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'update_progress':
            return UnitProgressUpdateSerializer
        return UserUnitProgressSerializer
    
    @action(detail=False, methods=['post'])
    def update_progress(self, request):
        """Mettre à jour manuellement la progression d'une unité"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        unit_id = serializer.validated_data['unit_id']
        unit = get_object_or_404(Unit, pk=unit_id)
        
        # Obtenir la langue cible depuis les paramètres de requête ou le profil utilisateur
        language_code = request.data.get('language_code') or request.query_params.get('language_code') or request.query_params.get('target_language')
        if not language_code and request.user.is_authenticated:
            language_code = getattr(request.user, 'target_language', 'en')
        language_code = language_code.lower() if language_code else 'en'
        
        logger.info(f"Updating unit progress for user {request.user.username}, unit {unit_id}, language {language_code}")
        
        # Récupérer ou créer l'objet de progression
        progress, created = UserUnitProgress.objects.get_or_create(
            user=request.user,
            unit=unit,
            language_code=language_code,
            defaults={
                'status': 'not_started',
                'completion_percentage': 0
            }
        )
        
        # Recalculer la progression basée sur les leçons dans la même langue
        progress.update_progress(language_code=language_code)
        
        # Marquer comme terminé si demandé
        if serializer.validated_data.get('mark_completed'):
            progress.mark_completed()
        
        return Response(
            UserUnitProgressSerializer(progress).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def by_level(self, request):
        """Récupérer la progression des unités par niveau"""
        level = request.query_params.get('level')
        if not level:
            return Response(
                {"error": "Le paramètre level est requis"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Obtenir la langue cible
        language_code = request.query_params.get('language_code') or request.query_params.get('target_language')
        if not language_code and request.user.is_authenticated:
            language_code = getattr(request.user, 'target_language', 'en')
        language_code = language_code.lower() if language_code else 'en'
            
        queryset = self.get_queryset().filter(
            unit__level=level,
            language_code=language_code  # Filtrer par langue
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
        
    @action(detail=False, methods=['get'])
    def by_language(self, request):
        """Récupérer la progression des unités par langue"""
        language_code = request.query_params.get('language_code')
        if not language_code:
            return Response(
                {"error": "Le paramètre language_code est requis"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        queryset = UserUnitProgress.objects.filter(
            user=request.user,
            language_code=language_code
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class ContentLessonProgressViewSet(UserProgressViewSet):
    """Gestion de la progression des contenus de leçon pour l'utilisateur connecté avec support multilingue"""
    
    def get_queryset(self):
        # Utilise UserCourseProgress avec un filtre sur le content_type
        user = self.request.user
        content_type = ContentType.objects.get_for_model(ContentLesson)
        
        # Filtrer par langue si spécifiée
        language_code = self.request.query_params.get('language_code') or self.request.query_params.get('target_language')
        
        queryset = UserCourseProgress.objects.filter(
            user=user,
            content_type=content_type
        )
        
        if language_code:
            queryset = queryset.filter(language_code=language_code)
        elif user.is_authenticated:
            # Utiliser la langue cible de l'utilisateur par défaut
            language_code = getattr(user, 'target_language', 'en').lower()
            queryset = queryset.filter(language_code=language_code)
            
        logger.debug(f"User {user.username} accessing content lesson progress data for language {language_code}")
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'update_progress':
            return ContentLessonProgressUpdateSerializer
        return ContentLessonProgressSerializer
    
    @action(detail=False, methods=['post'])
    def update_progress(self, request):
        """Mettre à jour la progression d'un contenu de leçon spécifique"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        content_lesson_id = serializer.validated_data['content_lesson_id']
        content_lesson = get_object_or_404(ContentLesson, pk=content_lesson_id)
        content_type = ContentType.objects.get_for_model(ContentLesson)
        
        # Obtenir la langue cible depuis les paramètres de requête ou le profil utilisateur
        language_code = request.data.get('language_code') or request.query_params.get('language_code') or request.query_params.get('target_language')
        if not language_code and request.user.is_authenticated:
            language_code = getattr(request.user, 'target_language', 'en')
        language_code = language_code.lower() if language_code else 'en'
        
        logger.info(f"Updating content lesson progress for user {request.user.username}, content lesson {content_lesson_id}, language {language_code}")
        
        # Récupérer ou créer l'objet de progression avec le critère de langue
        progress, created = UserCourseProgress.objects.get_or_create(
            user=request.user,
            content_type=content_type,
            object_id=content_lesson_id,
            language_code=language_code,
            defaults={
                'status': 'not_started',
                'completion_percentage': 0,
                'xp_earned': 0
            }
        )
        
        # Si nécessaire, marquer comme commencé
        if progress.status == 'not_started':
            if not progress.started_at:
                progress.mark_started()
        
        # Mettre à jour les champs si présents
        if 'completion_percentage' in serializer.validated_data:
            completion_percentage = serializer.validated_data['completion_percentage']
            score = serializer.validated_data.get('score')
            time_spent = serializer.validated_data.get('time_spent')
            xp_earned = serializer.validated_data.get('xp_earned')
            
            progress.update_progress(completion_percentage, score, time_spent)
            
            if xp_earned and xp_earned > progress.xp_earned:
                progress.xp_earned = xp_earned
                progress.save()
        
        # Marquer comme terminé si demandé
        if serializer.validated_data.get('mark_completed'):
            progress.mark_completed(
                score=serializer.validated_data.get('score', progress.score)
            )
            
            # Si XP fourni, mettre à jour
            if 'xp_earned' in serializer.validated_data:
                progress.xp_earned = serializer.validated_data['xp_earned']
                progress.save()
        
        # Mise à jour de la progression de la leçon associée (avec le même code langue)
        lesson_progress, _ = UserLessonProgress.objects.get_or_create(
            user=request.user,
            lesson=content_lesson.lesson,
            language_code=language_code,
            defaults={
                'status': 'not_started',
                'completion_percentage': 0
            }
        )
        
        # Calculer la progression de la leçon basée sur la progression des contenus
        lesson_content_items = ContentLesson.objects.filter(lesson=content_lesson.lesson)
        content_type = ContentType.objects.get_for_model(ContentLesson)
        
        content_progresses = UserCourseProgress.objects.filter(
            user=request.user,
            content_type=content_type,
            object_id__in=lesson_content_items.values_list('id', flat=True),
            language_code=language_code  # Filtrer par langue
        )
        
        if content_progresses.exists():
            total_items = lesson_content_items.count()
            completed_items = content_progresses.filter(status='completed').count()
            
            if completed_items == total_items:
                lesson_progress.mark_completed()
            else:
                # Calculer le pourcentage de progression
                total_percentage = sum(cp.completion_percentage for cp in content_progresses)
                avg_percentage = total_percentage // total_items if total_items > 0 else 0
                
                lesson_progress.update_progress(
                    completion_percentage=avg_percentage,
                    time_spent=sum(cp.time_spent for cp in content_progresses)
                )
        
        # Mise à jour de la progression de l'unité (avec le même code langue)
        unit_progress, _ = UserUnitProgress.objects.get_or_create(
            user=request.user,
            unit=content_lesson.lesson.unit,
            language_code=language_code,
            defaults={
                'status': 'not_started',
                'completion_percentage': 0
            }
        )
        unit_progress.update_progress(language_code=language_code)
        
        return Response(
            ContentLessonProgressSerializer(progress).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def by_lesson(self, request):
        """Récupérer la progression des contenus par leçon"""
        lesson_id = request.query_params.get('lesson_id')
        if not lesson_id:
            return Response(
                {"error": "Le paramètre lesson_id est requis"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Obtenir la langue cible
        language_code = request.query_params.get('language_code') or request.query_params.get('target_language')
        if not language_code and request.user.is_authenticated:
            language_code = getattr(request.user, 'target_language', 'en')
        language_code = language_code.lower() if language_code else 'en'
            
        content_lessons = ContentLesson.objects.filter(lesson_id=lesson_id)
        content_type = ContentType.objects.get_for_model(ContentLesson)
        
        queryset = self.get_queryset().filter(
            object_id__in=content_lessons.values_list('id', flat=True),
            language_code=language_code  # Filtrer par langue
        )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
        
    @action(detail=False, methods=['get'])
    def by_language(self, request):
        """Récupérer la progression des contenus par langue"""
        language_code = request.query_params.get('language_code')
        if not language_code:
            return Response(
                {"error": "Le paramètre language_code est requis"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        content_type = ContentType.objects.get_for_model(ContentLesson)
        queryset = UserCourseProgress.objects.filter(
            user=request.user,
            content_type=content_type,
            language_code=language_code
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class UserProgressSummaryView(generics.RetrieveAPIView):
    """Vue pour obtenir un résumé global de la progression de l'utilisateur"""
    permission_classes = [IsAuthenticated]
    
    def retrieve(self, request, *args, **kwargs):
        user = request.user
        
        logger.debug(f"User {user.username} retrieving progress summary")
        
        # Create initial unit progress entries if none exist
        units = Unit.objects.all()
        existing_unit_progress = UserUnitProgress.objects.filter(user=user)
        existing_unit_ids = set(existing_unit_progress.values_list('unit_id', flat=True))
        
        # Create missing unit progress entries
        new_unit_progress = []
        for unit in units:
            if unit.id not in existing_unit_ids:
                new_unit_progress.append(UserUnitProgress(
                    user=user,
                    unit=unit,
                    status='not_started',
                    completion_percentage=0
                ))
        
        if new_unit_progress:
            UserUnitProgress.objects.bulk_create(new_unit_progress)
            logger.info(f"Created {len(new_unit_progress)} initial unit progress entries for user {user.username}")
        
        # Refresh the queryset after potentially creating new entries
        units_progress = UserUnitProgress.objects.filter(user=user)
        lessons_progress = UserLessonProgress.objects.filter(user=user)
        
        # Progress by level
        level_stats = {}
        for level in Unit.LEVEL_CHOICES:
            level_code = level[0]
            units_in_level = units_progress.filter(unit__level=level_code)
            
            level_stats[level_code] = {
                'total_units': units_in_level.count(),
                'completed_units': units_in_level.filter(status='completed').count(),
                'in_progress_units': units_in_level.filter(status='in_progress').count(),
                'avg_completion': 0
            }
            
            if units_in_level.exists():
                total_completion = sum(u.completion_percentage for u in units_in_level)
                level_stats[level_code]['avg_completion'] = total_completion // units_in_level.count()
        
        # Contenus récemment consultés
        recent_items = UserCourseProgress.objects.filter(user=user).order_by('-last_accessed')[:5]
        recent_items_data = UserCourseContentProgressSerializer(recent_items, many=True).data
        
        # Statistiques d'activité
        total_time_spent = sum(l.time_spent for l in lessons_progress) / 60  # En minutes
        
        return Response({
            'summary': {
                'total_units': units_progress.count(),
                'completed_units': units_progress.filter(status='completed').count(),
                'total_lessons': lessons_progress.count(),
                'completed_lessons': lessons_progress.filter(status='completed').count(),
                'total_time_spent_minutes': total_time_spent,
                'xp_earned': UserCourseProgress.objects.filter(user=user).aggregate(
                    total_xp=Sum('xp_earned')
                )['total_xp'] or 0
            },
            'level_progression': level_stats,
            'recent_activity': recent_items_data
        })