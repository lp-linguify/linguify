# course/serializers.py
from rest_framework import serializers, generics
from .models import (
    Unit, 
    Lesson, 
    ContentLesson, 
    VocabularyList, 
    Grammar, 
    MultipleChoiceQuestion, 
    MatchingExercise,
    Numbers, 
    TheoryContent, 
    ExerciseGrammarReordering,
    FillBlankExercise,
    SpeakingExercise
)
import logging
logger = logging.getLogger(__name__)


class TargetLanguageMixin:
    """
    Mixin pour récupérer automatiquement la langue cible depuis les paramètres
    de requête, l'utilisateur ou les en-têtes HTTP.
    """
    def get_target_language(self):
        # Priorité 1: paramètre de requête
        target_language = self.request.query_params.get('target_language')
        
        # Ajoutez des logs pour déboguer
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"get_target_language - Lang from query params: {target_language}")
        
        # Priorité 2: header Accept-Language 
        if not target_language and 'Accept-Language' in self.request.headers:
            accept_lang = self.request.headers['Accept-Language'].split(',')[0].split('-')[0]
            if accept_lang in ['en', 'fr', 'es', 'nl']:
                target_language = accept_lang
                logger.info(f"get_target_language - Lang from Accept-Language: {target_language}")
                
        # Priorité 3: utilisateur authentifié
        if not target_language and hasattr(self.request, 'user') and self.request.user.is_authenticated:
            user_lang = getattr(self.request.user, 'target_language', None)
            if user_lang:
                target_language = user_lang.lower()
                logger.info(f"get_target_language - Lang from user profile: {target_language}")
        
        # Normaliser à minuscules
        if target_language and target_language.upper() in ['EN', 'FR', 'ES', 'NL']:
            target_language = target_language.lower()
        
        # Valeur par défaut
        if not target_language or target_language not in ['en', 'fr', 'es', 'nl']:
            target_language = 'en'
            
        logger.info(f"get_target_language - Final lang: {target_language}")
        return target_language
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        target_language = self.get_target_language()
        context['target_language'] = target_language
        
        # Log pour déboguer
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"get_serializer_context - Adding target_language to context: {target_language}")
        
        return context  

class UnitSerializer(serializers.ModelSerializer):
    # Titre dynamique basé sur la langue cible
    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()

    class Meta:
        model = Unit
        fields = ['id', 'title', 'description', 'level', 'order']

    # Méthode pour récupérer le titre dans la langue de l'utilisateur
    def get_title(self, obj):
        target_language = self._get_target_language().lower()
        field_name = f'title_{target_language}'
        return getattr(obj, field_name, obj.title_en)
    
    def get_description(self, obj):
        target_language = self._get_target_language().lower()
        field_name = f"description_{target_language}"
        value = getattr(obj, field_name, obj.description_en)
        return value
    
    def _get_target_language(self):
        request = self.context.get('request')
        target_lang = None
        
        # Priorité 1: contexte direct (ajouté par la vue)
        if 'target_language' in self.context:
            target_lang = self.context.get('target_language')
            logger.info(f"Langue cible depuis le contexte direct: {target_lang}")
            return target_lang
            
        # Priorité 2: paramètre de requête
        if request and request.query_params.get('target_language'):
            target_lang = request.query_params.get('target_language')
            logger.info(f"Langue cible depuis les paramètres: {target_lang}")
            return target_lang
            
        # Priorité 3: utilisateur authentifié
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            target_lang = getattr(request.user, 'target_language', 'en').lower()
            logger.info(f"Langue cible depuis le profil utilisateur: {target_lang}")
            return target_lang
            
        # Valeur par défaut
        logger.info("Utilisation de la langue par défaut: en")
        return 'en'

class LessonSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ['id', 'title', 'description', 'lesson_type', 'estimated_duration', 'order']

    def get_title(self, obj):
        # Get target language from context
        target_language = self.context.get('target_language', 'en')
        
        # Normalize to lowercase
        if target_language and target_language.upper() in ['EN', 'FR', 'ES', 'NL']:
            target_language = target_language.lower()
        
        # Get the field name based on language
        field_name = f'title_{target_language}'
        
        # Get the value, fallback to title_en if not found
        value = getattr(obj, field_name, obj.title_en)
        
        # Log for debugging
        logger.info(f"LessonSerializer - Lesson {obj.id}, target_language: {target_language}, field: {field_name}, value: {value}")
        
        return value

    def get_description(self, obj):
        # Même approche que pour title
        target_language = self.context.get('target_language', 'en')
        if target_language.upper() in ['EN', 'FR', 'ES', 'NL']:
            target_language = target_language.lower()
        
        field_name = f'description_{target_language}'
        return getattr(obj, field_name, obj.description_en)

class ContentLessonSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    instruction = serializers.SerializerMethodField()

    class Meta:
        model = ContentLesson
        fields = [
            'id',
            'title',
            'instruction',
            'content_type',
            'estimated_duration',
            'order'
        ]

    def get_title(self, obj):
        # Retourner un dictionnaire avec toutes les traductions
        return {
            'en': obj.title_en,
            'fr': obj.title_fr,
            'es': obj.title_es,
            'nl': obj.title_nl
        }

    def get_instruction(self, obj):
        # Retourner un dictionnaire avec toutes les traductions
        return {
            'en': obj.instruction_en,
            'fr': obj.instruction_fr,
            'es': obj.instruction_es,
            'nl': obj.instruction_nl
        }

''' This section if for the content of the lesson of Linguify
    The content of the lesson can be a theory, vocabulary, grammar, multiple choice, numbers, reordering, matching, question and answer, fill in the blanks, true or false, test, etc.
    The content of the lesson is stored in the ContentLesson model.
    The content of the lesson can be in different languages: English, French, Spanish, Dutch.
'''

class VocabularyListSerializer(serializers.ModelSerializer):
    word = serializers.SerializerMethodField()
    example_sentence = serializers.SerializerMethodField()
    definition = serializers.SerializerMethodField()
    word_type = serializers.SerializerMethodField()
    synonymous = serializers.SerializerMethodField()
    antonymous = serializers.SerializerMethodField()

    class Meta:
        model = VocabularyList
        fields = ['id', 
                  'content_lesson',
                  'word',
                  'definition',
                  'example_sentence',
                  'word_type',
                  'synonymous',
                  'antonymous',
                  'word_en', 
                  'word_fr', 
                  'word_es', 
                  'word_nl',
                  'definition_en',
                  'definition_fr',
                  'definition_es',
                  'definition_nl',
                  'example_sentence_en', 
                  'example_sentence_fr', 
                  'example_sentence_es', 
                  'example_sentence_nl',
                  'word_type_en',
                  'word_type_fr',
                  'word_type_es',
                  'word_type_nl',
                  'synonymous_en',
                  'synonymous_fr',
                  'synonymous_es',
                  'synonymous_nl',
                  'antonymous_en',
                  'antonymous_fr',
                  'antonymous_es',
                  'antonymous_nl']

    def get_word(self, obj):
        target_language = self.context.get('target_language', 'en')
        return obj.get_translation(target_language)

    def get_example_sentence(self, obj):
        target_language = self.context.get('target_language', 'en')
        return obj.get_example_sentence(target_language)

    def get_definition(self, obj):
        target_language = self.context.get('target_language', 'en')
        return obj.get_definition(target_language)

    def get_word_type(self, obj):
        target_language = self.context.get('target_language', 'en')
        return obj.get_word_type(target_language)

    def get_synonymous(self, obj):
        target_language = self.context.get('target_language', 'en')
        return obj.get_synonymous(target_language)

    def get_antonymous(self, obj):
        target_language = self.context.get('target_language', 'en')
        return obj.get_antonymous(target_language)

class SpeakingExerciseSerializer(serializers.ModelSerializer):
    vocabulary_items = VocabularyListSerializer(many=True, read_only=True)

    class Meta:
        model = SpeakingExercise
        fields = ['id', 'vocabulary_items']


class TheoryContentSerializer(serializers.ModelSerializer):
    content_lesson = ContentLessonSerializer(read_only=True)

    class Meta:
        model = TheoryContent
        fields = '__all__'

class ContentLessonDetailSerializer(ContentLessonSerializer):
    vocabulary_lists = VocabularyListSerializer(many=True, read_only=True)
    
    class Meta(ContentLessonSerializer.Meta):
        fields = ContentLessonSerializer.Meta.fields + ['vocabulary_lists']

class MultipleChoiceQuestionSerializer(serializers.ModelSerializer):
    question = serializers.SerializerMethodField()
    correct_answer = serializers.SerializerMethodField()
    fake_answers = serializers.SerializerMethodField()
    hint_answer = serializers.SerializerMethodField()

    class Meta:
        model = MultipleChoiceQuestion
        fields = [
            'id',
            'content_lesson',
            'question',
            'correct_answer',
            'fake_answers',
            'hint_answer',
            # Champs originaux pour référence
            'question_en',
            'question_fr',
            'question_es',
            'question_nl',
            'correct_answer_en',
            'correct_answer_fr',
            'correct_answer_es',
            'correct_answer_nl',
            'fake_answer1_en',
            'fake_answer2_en',
            'fake_answer3_en',
            'fake_answer4_en',
            'fake_answer1_fr',
            'fake_answer2_fr',
            'fake_answer3_fr',
            'fake_answer4_fr',
            'fake_answer1_es',
            'fake_answer2_es',
            'fake_answer3_es',
            'fake_answer4_es',
            'fake_answer1_nl',
            'fake_answer2_nl',
            'fake_answer3_nl',
            'fake_answer4_nl',
            'hint_answer_en',
            'hint_answer_fr',
            'hint_answer_es',
            'hint_answer_nl'
        ]

    def get_question(self, obj):
        target_language = self.context.get('target_language', 'en')
        return getattr(obj, f'question_{target_language}', obj.question_en)

    def get_correct_answer(self, obj):
        target_language = self.context.get('target_language', 'en')
        return getattr(obj, f'correct_answer_{target_language}', obj.correct_answer_en)

    def get_fake_answers(self, obj):
        target_language = self.context.get('target_language', 'en')
        fake_answers = []
        for i in range(1, 5):
            answer = getattr(obj, f'fake_answer{i}_{target_language}')
            if answer:
                fake_answers.append(answer)
        return fake_answers

    def get_hint_answer(self, obj):
        target_language = self.context.get('target_language', 'en')
        return getattr(obj, f'hint_answer_{target_language}', obj.hint_answer_en)

    def to_representation(self, instance):
        """Personnaliser la sortie finale du serializer"""
        data = super().to_representation(instance)
        
        # Ajouter toutes les réponses mélangées dans un seul tableau
        all_answers = [data['correct_answer']] + data['fake_answers']
        import random
        random.shuffle(all_answers)
        
        # Créer la représentation finale
        return {
            'id': data['id'],
            'content_lesson': data['content_lesson'],
            'question': data['question'],
            'answers': all_answers,  # Toutes les réponses mélangées
            'correct_answer': data['correct_answer'],  # Pour la vérification
            'hint': data['hint_answer']
        }

class NumbersSerializer(serializers.ModelSerializer):
    number = serializers.SerializerMethodField()

    class Meta:
        model = Numbers
        fields = ['id', 'content_lesson', 'number', 'number_en', 'number_fr', 'number_es', 'number_nl', 'is_reviewed']

    def get_number(self, obj):
        target_language = self.context.get('target_language', 'en')
        return getattr(obj, f'number_{target_language}', obj.number_en)
    
    def get_is_reviewed(self, obj):
        # need to active this code when the feature of authenticated user is implemented
        # user = self.context.get('request').user
        # if user and user.is_authenticated:
        return obj.is_reviewed
        # return False

class MatchingExerciseSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour les exercices d'association entre langues.
    Expose l'exercice formaté en fonction des langues de l'utilisateur.
    """
    exercise_data = serializers.SerializerMethodField()
    
    class Meta:
        model = MatchingExercise
        fields = [
            'id', 'content_lesson', 'difficulty', 'pairs_count', 
            'order', 'exercise_data'
        ]
    
    def get_exercise_data(self, obj):
        """
        Récupère les données formatées de l'exercice en fonction des langues spécifiées.
        Si aucune langue n'est spécifiée, utilise les valeurs par défaut (en/fr).
        """
        request = self.context.get('request')
        if not request:
            return obj.get_exercise_data()
        
        # Récupérer les langues depuis les paramètres de requête
        native_language = request.query_params.get('native_language', 'en')
        target_language = request.query_params.get('target_language', 'fr')
        
        # Valider les langues supportées
        supported_languages = ['en', 'fr', 'es', 'nl']
        if native_language not in supported_languages:
            native_language = 'en'
        if target_language not in supported_languages:
            target_language = 'fr'
        
        # Éviter que les deux langues soient identiques
        if native_language == target_language:
            # Choisir une langue cible différente
            languages = [lang for lang in supported_languages if lang != native_language]
            target_language = languages[0] if languages else 'fr'
        
        return obj.get_exercise_data(native_language, target_language)  

class ExerciseGrammarReorderingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExerciseGrammarReordering
        fields = ['id', 'content_lesson', 'sentence_en', 'sentence_fr', 'sentence_es', 'sentence_nl', 'explanation', 'hint']

class GrammarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grammar
        fields = ['title', 'description', 'example']

# Update this section in course/serializers.py

class FillBlankExerciseSerializer(serializers.ModelSerializer):
    """
    Serializer for fill in the blank exercises with enhanced API compatibility
    Provides both nested content field and direct fields for frontend flexibility
    """
    available_languages = serializers.SerializerMethodField()
    content = serializers.SerializerMethodField()
    
    # Add direct field accessors for simpler API responses
    instruction = serializers.SerializerMethodField()
    sentence = serializers.SerializerMethodField()
    options = serializers.SerializerMethodField()
    correct_answer = serializers.SerializerMethodField()
    hint = serializers.SerializerMethodField()
    explanation = serializers.SerializerMethodField()
    
    class Meta:
        model = FillBlankExercise
        fields = [
            'id', 'content_lesson', 'order', 'difficulty', 
            'content', 'available_languages', 'tags',
            'created_at', 'updated_at',
            # Add direct field accessors
            'instruction', 'sentence', 'options', 'correct_answer',
            'hint', 'explanation'
        ]
    
    def get_available_languages(self, obj):
        """Returns the list of available languages for this exercise"""
        return obj.get_available_languages()
    
    def get_content(self, obj):
        """Returns the full content for a specific language"""
        target_language = self._get_target_language()
        return obj.get_content_for_language(target_language)
    
    # Direct field access methods
    def get_instruction(self, obj):
        """Returns the instruction in the target language"""
        target_language = self._get_target_language()
        return obj.instructions.get(target_language, obj.instructions.get('en', "Fill in the blank"))
    
    def get_sentence(self, obj):
        """Returns the sentence with blank in the target language"""
        target_language = self._get_target_language()
        return obj.sentences.get(target_language, obj.sentences.get('en', ""))
    
    def get_options(self, obj):
        """Returns the options in the target language"""
        target_language = self._get_target_language()
        return obj.answer_options.get(target_language, obj.answer_options.get('en', []))
    
    def get_correct_answer(self, obj):
        """Returns the correct answer in the target language"""
        target_language = self._get_target_language()
        return obj.correct_answers.get(target_language, obj.correct_answers.get('en', ""))
    
    def get_hint(self, obj):
        """Returns the hint in the target language if available"""
        if not obj.hints:
            return ""
        target_language = self._get_target_language()
        return obj.hints.get(target_language, obj.hints.get('en', ""))
    
    def get_explanation(self, obj):
        """Returns the explanation in the target language if available"""
        if not obj.explanations:
            return ""
        target_language = self._get_target_language()
        return obj.explanations.get(target_language, obj.explanations.get('en', ""))
    
    def _get_target_language(self):
        """
        Determines the target language from the request context
        Returns 'en' as fallback if no language is specified
        """
        request = self.context.get('request')
        if not request:
            return 'en'
            
        # Check request parameters first
        language = request.query_params.get('language') or request.query_params.get('target_language')
        if language:
            return language.lower()
            
        # Check Accept-Language header
        if 'Accept-Language' in request.headers:
            accept_lang = request.headers['Accept-Language'].split(',')[0].split(';')[0].strip()
            if accept_lang and len(accept_lang) >= 2:
                return accept_lang[:2].lower()
        
        # Check authenticated user preferences
        if hasattr(request, 'user') and request.user.is_authenticated:
            user_language = getattr(request.user, 'target_language', None)
            if user_language:
                return user_language.lower()
        
        # Default fallback
        return 'en'