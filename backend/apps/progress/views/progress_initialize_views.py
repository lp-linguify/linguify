# backend/progress/views/progress_initialize_views.py

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
import logging

from course.models import Unit, Lesson, ContentLesson
from ..models.progress_course import UserUnitProgress, UserLessonProgress, UserCourseProgress
from django.contrib.contenttypes.models import ContentType

logger = logging.getLogger(__name__)

class InitializeProgressView(APIView):
    """
    Endpoint pour initialiser les données de progression pour un nouvel utilisateur
    ou pour réinitialiser la progression d'un utilisateur existant pour une langue spécifique
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        user = request.user
        
        # Obtenir la langue cible depuis les paramètres de requête ou le profil utilisateur
        language_code = request.query_params.get('language_code') or request.query_params.get('target_language')
        if not language_code and request.user.is_authenticated:
            language_code = getattr(request.user, 'target_language', 'en')
        language_code = language_code.lower() if language_code else 'en'
        
        logger.info(f"Initializing progress data for user {user.username} with language {language_code}")
        
        # Récupérer toutes les unités, leçons, et contenus de leçon
        units = Unit.objects.all().order_by('level', 'order')
        
        # Créer les entrées de progression pour chaque unité si elles n'existent pas déjà
        units_created = 0
        units_existing = 0
        
        for unit in units:
            unit_progress, created = UserUnitProgress.objects.get_or_create(
                user=user,
                unit=unit,
                language_code=language_code,  # Ajout du champ pour la langue
                defaults={
                    'status': 'not_started',
                    'completion_percentage': 0
                }
            )
            
            if created:
                units_created += 1
            else:
                units_existing += 1
            
            # Créer les entrées de progression pour chaque leçon de cette unité
            lessons = Lesson.objects.filter(unit=unit).order_by('order')
            lessons_created = 0
            
            for lesson in lessons:
                lesson_progress, lesson_created = UserLessonProgress.objects.get_or_create(
                    user=user,
                    lesson=lesson,
                    language_code=language_code,  # Ajout du champ pour la langue
                    defaults={
                        'status': 'not_started',
                        'completion_percentage': 0
                    }
                )
                
                if lesson_created:
                    lessons_created += 1
                
                # Initialiser les contenus de leçon
                content_lessons = ContentLesson.objects.filter(lesson=lesson).order_by('order')
                content_type = ContentType.objects.get_for_model(ContentLesson)
                
                for content in content_lessons:
                    UserCourseProgress.objects.get_or_create(
                        user=user,
                        content_type=content_type,
                        object_id=content.id,
                        language_code=language_code,  # Ajout du champ pour la langue
                        defaults={
                            'status': 'not_started',
                            'completion_percentage': 0,
                            'xp_earned': 0
                        }
                    )
            
            logger.debug(f"Created {lessons_created} lesson progress entries for unit {unit.id} in language {language_code}")
        
        # Mettre à jour le statut pour le premier niveau A1 afin de le marquer comme "en cours"
        # Cela permet à l'utilisateur d'avoir un bon point de départ
        first_a1_unit = units.filter(level='A1').first()
        if first_a1_unit:
            first_unit_progress = UserUnitProgress.objects.get(
                user=user, 
                unit=first_a1_unit,
                language_code=language_code  # Ajout du champ pour la langue
            )
            if first_unit_progress.status == 'not_started':
                first_unit_progress.status = 'in_progress'
                first_unit_progress.save()
                
                # Également marquer la première leçon comme en cours
                first_lesson = Lesson.objects.filter(unit=first_a1_unit).order_by('order').first()
                if first_lesson:
                    first_lesson_progress = UserLessonProgress.objects.get(
                        user=user, 
                        lesson=first_lesson,
                        language_code=language_code  # Ajout du champ pour la langue
                    )
                    first_lesson_progress.status = 'in_progress'
                    first_lesson_progress.save()
        
        logger.info(f"Progress initialized for language {language_code}: {units_created} new units, {units_existing} existing units")
        
        return Response({
            'success': True,
            'message': f'Progress data has been initialized for language {language_code}',
            'language_code': language_code,
            'stats': {
                'units_created': units_created,
                'units_existing': units_existing,
                'total_units': units.count()
            }
        }, status=status.HTTP_200_OK)