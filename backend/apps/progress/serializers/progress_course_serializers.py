# backend/progress/serializers/progress_course.py

from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from ..models.progress_course import UserCourseProgress, UserLessonProgress, UserUnitProgress
from course.models import Lesson, Unit, ContentLesson

class UserCourseProgressSerializer(serializers.ModelSerializer):
    content_object_info = serializers.SerializerMethodField()
    
    class Meta:
        model = UserCourseProgress
        fields = [
            'id', 'user', 'content_type', 'object_id', 'content_object_info',
            'status', 'completion_percentage', 'score', 'time_spent', 'xp_earned',
            'last_accessed', 'started_at', 'completed_at', 'language_code'  
        ]
        read_only_fields = ['last_accessed', 'started_at', 'completed_at']
    
    def get_content_object_info(self, obj):
        """Récupère des informations sur l'objet lié"""
        content_object = obj.content_object
        if content_object:
            info = {
                'id': content_object.id,
                'content_type': obj.content_type.model,
            }
            
            if hasattr(content_object, f'title_{obj.language_code}'):
                info['title'] = getattr(content_object, f'title_{obj.language_code}', None)
            elif hasattr(content_object, 'title_en'):
                info['title'] = content_object.title_en
            elif hasattr(content_object, 'name'):
                info['title'] = content_object.name
            
            return info
        return None

class UserLessonProgressSerializer(serializers.ModelSerializer):
    lesson_details = serializers.SerializerMethodField()
    
    class Meta:
        model = UserLessonProgress
        fields = [
            'id', 'user', 'lesson', 'lesson_details', 'status', 
            'completion_percentage', 'score', 'time_spent',
            'last_accessed', 'started_at', 'completed_at', 'language_code'  
        ]
        read_only_fields = ['user', 'last_accessed', 'started_at', 'completed_at']
    
    def get_lesson_details(self, obj):
        """Récupère les détails de la leçon associée dans la langue appropriée"""
        lesson = obj.lesson
        lang_code = obj.language_code or 'en'
        
        title_field = f'title_{lang_code}' if hasattr(lesson, f'title_{lang_code}') else 'title_en'
        desc_field = f'description_{lang_code}' if hasattr(lesson, f'description_{lang_code}') else 'description_en'
        
        return {
            'id': lesson.id,
            'title': getattr(lesson, title_field),
            'description': getattr(lesson, desc_field),
            'lesson_type': lesson.lesson_type,
            'estimated_duration': lesson.estimated_duration,
            'order': lesson.order,
            'unit_id': lesson.unit_id,
            'unit_title': getattr(lesson.unit, f'title_{lang_code}', lesson.unit.title_en),
            'language_code': lang_code  
        }

class UserUnitProgressSerializer(serializers.ModelSerializer):
    unit_details = serializers.SerializerMethodField()
    lesson_progress_count = serializers.SerializerMethodField()
    
    class Meta:
        model = UserUnitProgress
        fields = [
            'id', 'user', 'unit', 'unit_details', 'status', 
            'completion_percentage', 'score', 'time_spent',
            'last_accessed', 'started_at', 'completed_at',
            'lesson_progress_count', 'language_code'
        ]
        read_only_fields = ['user', 'last_accessed', 'started_at', 'completed_at']
    
    def get_unit_details(self, obj):
        """Récupère les détails de l'unité associée"""
        unit = obj.unit
        lang_code = obj.language_code or 'en'
        
        title_field = f'title_{lang_code}' if hasattr(unit, f'title_{lang_code}') else 'title_en'
        desc_field = f'description_{lang_code}' if hasattr(unit, f'description_{lang_code}') else 'description_en'
        
        return {
            'id': unit.id,
            'title': getattr(unit, title_field),
            'description': getattr(unit, desc_field),
            'level': unit.level,
            'order': unit.order,
            'language_code': lang_code
        }
    
    def get_lesson_progress_count(self, obj):
        """Compte les leçons dans différents états de progression"""
        lesson_progresses = UserLessonProgress.objects.filter(
            user=obj.user,
            lesson__unit=obj.unit,
            language_code=obj.language_code
        )
        
        return {
            'total': lesson_progresses.count(),
            'not_started': lesson_progresses.filter(status='not_started').count(),
            'in_progress': lesson_progresses.filter(status='in_progress').count(),
            'completed': lesson_progresses.filter(status='completed').count(),
        }

class ContentLessonProgressSerializer(serializers.ModelSerializer):
    """Sérialiseur utilisant UserCourseProgress pour suivre la progression des contenus de leçon"""
    content_lesson_details = serializers.SerializerMethodField()
    
    class Meta:
        model = UserCourseProgress
        fields = [
            'id', 'user', 'content_lesson_details',
            'status', 'completion_percentage', 'score', 'time_spent',
            'last_accessed', 'started_at', 'completed_at', 'xp_earned'
        ]
        read_only_fields = ['last_accessed', 'started_at', 'completed_at']
    
    def get_content_lesson_details(self, obj):
        """Récupère des détails sur le contenu de leçon"""
        if obj.content_type.model == 'contentlesson':
            content_lesson = obj.content_object
            return {
                'id': content_lesson.id,
                'title': content_lesson.title_en,
                'content_type': content_lesson.content_type,
                'lesson_id': content_lesson.lesson_id,
                'lesson_title': content_lesson.lesson.title_en,
                'order': content_lesson.order
            }
        return None

class UserUnitProgressSerializer(serializers.ModelSerializer):
    unit_details = serializers.SerializerMethodField()
    lesson_progress_count = serializers.SerializerMethodField()
    
    class Meta:
        model = UserUnitProgress
        fields = [
            'id', 'user', 'unit', 'unit_details', 'status', 
            'completion_percentage', 'score', 'time_spent',
            'last_accessed', 'started_at', 'completed_at',
            'lesson_progress_count', 'language_code'  # Ajout de language_code
        ]
        read_only_fields = ['user', 'last_accessed', 'started_at', 'completed_at']
    
    def get_unit_details(self, obj):
        """Récupère les détails de l'unité associée dans la langue appropriée"""
        unit = obj.unit
        # Utiliser la langue de la progression pour les détails de l'unité
        lang_code = obj.language_code
        
        # Fallback sur l'anglais si le champ spécifique à la langue n'existe pas
        title_field = f'title_{lang_code}' if hasattr(unit, f'title_{lang_code}') else 'title_en'
        desc_field = f'description_{lang_code}' if hasattr(unit, f'description_{lang_code}') else 'description_en'
        
        return {
            'id': unit.id,
            'title': getattr(unit, title_field),
            'description': getattr(unit, desc_field),
            'level': unit.level,
            'order': unit.order,
            'language_code': lang_code  # Inclure le code de langue dans les détails
        }
    
    def get_lesson_progress_count(self, obj):
        """Compte les leçons dans différents états de progression pour la même langue"""
        lesson_progresses = UserLessonProgress.objects.filter(
            user=obj.user,
            lesson__unit=obj.unit,
            language_code=obj.language_code  # Filtrer les leçons dans la même langue
        )
        
        return {
            'total': lesson_progresses.count(),
            'not_started': lesson_progresses.filter(status='not_started').count(),
            'in_progress': lesson_progresses.filter(status='in_progress').count(),
            'completed': lesson_progresses.filter(status='completed').count(),
        }

class UserCourseContentProgressSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les données de progression de contenu de cours avec support multilingue"""
    content_details = serializers.SerializerMethodField()
    
    class Meta:
        model = UserCourseProgress
        fields = [
            'id', 'user', 'content_details', 'status', 
            'completion_percentage', 'score', 'time_spent', 'xp_earned',
            'last_accessed', 'started_at', 'completed_at', 'language_code'
        ]
        read_only_fields = ['user', 'last_accessed', 'started_at', 'completed_at']
    
    def get_content_details(self, obj):
        """Récupère les détails adaptés selon le type de contenu"""
        content_object = obj.content_object
        content_type = obj.content_type.model
        
        if not content_object:
            return None
            
        # Informations de base
        details = {
            'id': content_object.id,
            'content_type': content_type,
        }
        
        # Utiliser la langue de la progression pour récupérer le bon titre
        lang = obj.language_code
        
        # Ajouter les traductions si disponibles
        for field in ['title', 'description']:
            lang_field = f'{field}_{lang}'
            if hasattr(content_object, lang_field):
                details[field] = getattr(content_object, lang_field)
            elif hasattr(content_object, f'{field}_en'):
                details[field] = getattr(content_object, f'{field}_en')
                
        return details

class LessonProgressUpdateSerializer(serializers.Serializer):
    """Sérialiseur pour mettre à jour facilement la progression de leçon"""
    lesson_id = serializers.IntegerField(required=True)
    completion_percentage = serializers.IntegerField(
        required=False, 
        min_value=0, 
        max_value=100
    )
    score = serializers.IntegerField(
        required=False, 
        min_value=0, 
        max_value=100
    )
    time_spent = serializers.IntegerField(
        required=False,
        min_value=0
    )
    mark_completed = serializers.BooleanField(required=False, default=False)
    xp_earned = serializers.IntegerField(required=False, min_value=0)
    language_code = serializers.CharField(required=False, max_length=10)  # Ajout du champ langue
    
    def validate_lesson_id(self, value):
        """Valide que la leçon existe"""
        try:
            Lesson.objects.get(pk=value)
        except Lesson.DoesNotExist:
            raise serializers.ValidationError(f"Leçon avec id {value} n'existe pas")
        return value

class UnitProgressUpdateSerializer(serializers.Serializer):
    """Sérialiseur pour mettre à jour facilement la progression d'unité"""
    unit_id = serializers.IntegerField(required=True)
    mark_completed = serializers.BooleanField(required=False, default=False)
    
    def validate_unit_id(self, value):
        """Valide que l'unité existe"""
        try:
            Unit.objects.get(pk=value)
        except Unit.DoesNotExist:
            raise serializers.ValidationError(f"Unité avec id {value} n'existe pas")
        return value

class ContentLessonProgressUpdateSerializer(serializers.Serializer):
    """Sérialiseur pour mettre à jour la progression d'un contenu de leçon spécifique"""
    content_lesson_id = serializers.IntegerField(required=True)
    completion_percentage = serializers.IntegerField(
        required=False, 
        min_value=0, 
        max_value=100
    )
    score = serializers.IntegerField(
        required=False, 
        min_value=0, 
        max_value=100
    )
    time_spent = serializers.IntegerField(
        required=False,
        min_value=0
    )
    mark_completed = serializers.BooleanField(required=False, default=False)
    xp_earned = serializers.IntegerField(required=False, min_value=0)
    
    def validate_content_lesson_id(self, value):
        """Valide que le contenu de leçon existe"""
        try:
            ContentLesson.objects.get(pk=value)
        except ContentLesson.DoesNotExist:
            raise serializers.ValidationError(f"Contenu de leçon avec id {value} n'existe pas")
        return value