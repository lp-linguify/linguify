# course/models.py
from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator, ValidationError
from django.utils.translation import gettext_lazy as _
from django.utils.translation import gettext as _
from authentication.models import User


import logging

logger = logging.getLogger(__name__)

""" Learning Path Overview:
-----------------------
1. Languages:
    - English, French, Spanish, Dutch.
2. Levels:
    - A1 to C2.
3. Units:
    - Unit 1: Vocabulary, Theory, and Exercises.
    - Unit 2: Grammar and Exercises.
4. Progression:
    - Includes Theory -> Exercises -> Test.

Refer to the diagram for more details: path/to/image.png
"""

""" class MultilingualMixin:
    def get_localized_field(self, field_base_name, target_language='en'):
        field_name = f"{field_base_name}_{target_language}"
        return getattr(self, field_name, getattr(self, f"{field_base_name}_en", None))
"""
# Type activity choices
TYPE_ACTIVITY = [
    ('Theory', 'Theory'),
    ('Vocabulary', 'Vocabulary'),
    ('Grammar', 'Grammar'),
    ('Listening', 'Listening'),
    ('Speaking', 'Speaking'),
    ('Reading', 'Reading'),
    ('Writing', 'Writing'),
    ('Test', 'Test'),
]

class Unit(models.Model):
    LEVEL_CHOICES = [
        ('A1', 'A1'),
        ('A2', 'A2'),
        ('B1', 'B1'),
        ('B2', 'B2'),
        ('C1', 'C1'),
        ('C2', 'C2'),
    ]
    title_en = models.CharField(max_length=100, blank=False, null=False)
    title_fr = models.CharField(max_length=100, blank=False, null=False)
    title_es = models.CharField(max_length=100, blank=False, null=False)
    title_nl = models.CharField(max_length=100, blank=False, null=False)
    description_en = models.TextField(null=True, blank=True)
    description_fr = models.TextField(null=True, blank=True)
    description_es = models.TextField(null=True, blank=True)
    description_nl = models.TextField(null=True, blank=True)
    level = models.CharField(max_length=2, choices=LEVEL_CHOICES, blank=False, null=False)
    order = models.PositiveIntegerField(blank=False, null=False, default=1)

    def get_formatted_titles(self):
        titles = {
            'EN': self.title_en,
            'FR': self.title_fr,
            'ES': self.title_es,
            'NL': self.title_nl
        }
        return ' | '.join(
            f"{lang}: {title[:20]}..." if len(title) > 20 else f"{lang}: {title}"
            for lang, title in titles.items()
        )


    def __str__(self):
        unit_info = f"Unit {self.order:02d}".ljust(15)
        level_info = f"[{self.level}]".ljust(5)
        return f"{unit_info} {level_info} {self.get_formatted_titles()}"

    def get_unit_title(self, target_language='en'):
        match target_language:
            case 'fr':
                return self.title_fr
            case 'es':
                return self.title_es
            case 'nl':
                return self.title_nl
            case "en":
                return self.title_en
            case _:
                return "Language not supported"

 
    def update_unit_descriptions(self, save_immediately=True):
        """
        Met à jour les descriptions de l'unité pour toutes les langues
        """
        languages = ['en', 'fr', 'es', 'nl']
        
        for lang in languages:
            # Fallback sur 'en' si la langue n'existe pas
            description = self.generate_unit_description(lang)
            setattr(self, f'description_{lang}', description)
        
        if save_immediately:
            # Mise à jour directe sans passer par save()
            Unit.objects.filter(pk=self.pk).update(
                description_en=self.description_en,
                description_fr=self.description_fr,
                description_es=self.description_es,
                description_nl=self.description_nl
            )
        
        return self

    def generate_unit_description(self, lang='en'):
        """
        Génère une description pour une langue spécifique
        """
        lessons = self.lessons.all().order_by('order')
        
        # Templates de description par langue
        description_templates = {
            'en': "Key topics: {titles}. ({lesson_count} lessons, {duration} min)",
            'fr': "Sujets clés : {titles}. ({lesson_count} leçons, {duration} min)",
            'es': "Temas clave: {titles}. ({lesson_count} lecciones, {duration} min)",
            'nl': "Kernonderwerpen: {titles}. ({lesson_count} lessen, {duration} min)"
        }
        
        if not lessons.exists():
            default_msgs = {
                'en': f"This {self.level} unit coming soon.",
                'fr': f"Cette unité de niveau {self.level} bientôt disponible.",
                'es': f"Esta unidad de nivel {self.level} próximamente.",
                'nl': f"Deze {self.level} unit komt binnenkort."
            }
            return default_msgs.get(lang, default_msgs['en'])
        
        # Récupérer les titres de leçons
        lesson_titles = [getattr(lesson, f'title_{lang}', lesson.title_en) for lesson in lessons]
        total_duration = sum(lesson.estimated_duration for lesson in lessons)
        
        # Limiter le nombre de titres
        max_titles = 3
        titles_display = lesson_titles[:max_titles]
        if len(lesson_titles) > max_titles:
            titles_display.append("...")
        
        return description_templates.get(lang, description_templates['en']).format(
            titles=', '.join(titles_display),
            lesson_count=len(lessons),
            duration=total_duration
        )

    def save(self, *args, update_descriptions=True, **kwargs):
        """
        Surcharge de save pour générer des descriptions si nécessaire
        """
        # Générer des descriptions uniquement si update_descriptions est True
        if update_descriptions:
            for lang in ['en', 'fr', 'es', 'nl']:
                description = self.generate_unit_description(lang)
                setattr(self, f'description_{lang}', description)
        
        super().save(*args, **kwargs)

class Lesson(models.Model):
    LESSON_TYPE = [
        ('vocabulary', 'Vocabulary'),
        ('grammar', 'Grammar'),
        ('culture', 'Culture'), # ex: culture, history, geography, etc.
        ('professional', 'Professional'), # ex: business, medical, dentistry, advocacy, accounting, business law, real estate, etc. 
    ]
    PROFESSIONAL_CHOICES = [
        # Health and medicine
        ('medical_doctor', 'Medical Doctor'),
        ('nursing', 'Nursing'),
        ('dentistry', 'Dentistry'),
        ('pharmacy', 'Pharmacy'),
        ('physiotherapy', 'Physiotherapy'),
        ('psychology', 'Psychology'),
        ('psychiatry', 'Psychiatry'),
        ('veterinary', 'Veterinary Medicine'),
        ('optometry', 'Optometry'),
        ('radiology', 'Radiology'),
        ('surgery', 'Surgery'),
        ('public_health', 'Public Health'),
        ('nutrition', 'Nutrition'),
        
        # Droit et justice
        ('law', 'Law'),
        ('criminal_law', 'Criminal Law'),
        ('civil_law', 'Civil Law'),
        ('corporate_law', 'Corporate Law'),
        ('international_law', 'International Law'),
        ('intellectual_property', 'Intellectual Property'),
        ('legal_assistance', 'Legal Assistance'),
        ('notary', 'Notary'),
        
        # Finance et comptabilité
        ('accounting', 'Accounting'),
        ('auditing', 'Auditing'),
        ('financial_analysis', 'Financial Analysis'),
        ('banking', 'Banking'),
        ('investment', 'Investment'),
        ('insurance', 'Insurance'),
        ('tax_consulting', 'Tax Consulting'),
        ('financial_planning', 'Financial Planning'),
        
        # Affaires et gestion
        ('business_management', 'Business Management'),
        ('marketing', 'Marketing'),
        ('sales', 'Sales'),
        ('human_resources', 'Human Resources'),
        ('consulting', 'Consulting'),
        ('entrepreneurship', 'Entrepreneurship'),
        ('project_management', 'Project Management'),
        ('operations_management', 'Operations Management'),
        ('supply_chain', 'Supply Chain Management'),
        
        # Immobilier et construction
        ('real_estate', 'Real Estate'),
        ('architecture', 'Architecture'),
        ('civil_engineering', 'Civil Engineering'),
        ('construction', 'Construction'),
        ('interior_design', 'Interior Design'),
        ('urban_planning', 'Urban Planning'),
        ('property_management', 'Property Management'),
        
        # Technologies et informatique
        ('software_development', 'Software Development'),
        ('web_development', 'Web Development'),
        ('data_science', 'Data Science'),
        ('cybersecurity', 'Cybersecurity'),
        ('network_administration', 'Network Administration'),
        ('database_administration', 'Database Administration'),
        ('it_support', 'IT Support'),
        ('artificial_intelligence', 'Artificial Intelligence'),
        ('cloud_computing', 'Cloud Computing'),
        
        # Ingénierie
        ('mechanical_engineering', 'Mechanical Engineering'),
        ('electrical_engineering', 'Electrical Engineering'),
        ('chemical_engineering', 'Chemical Engineering'),
        ('aerospace_engineering', 'Aerospace Engineering'),
        ('industrial_engineering', 'Industrial Engineering'),
        ('biomedical_engineering', 'Biomedical Engineering'),
        ('environmental_engineering', 'Environmental Engineering'),
        
        # Éducation
        ('teaching', 'Teaching'),
        ('university_professor', 'University Professor'),
        ('early_childhood_education', 'Early Childhood Education'),
        ('special_education', 'Special Education'),
        ('educational_administration', 'Educational Administration'),
        ('adult_education', 'Adult Education'),
        ('language_instruction', 'Language Instruction'),
        
        # Communications et média
        ('journalism', 'Journalism'),
        ('public_relations', 'Public Relations'),
        ('publishing', 'Publishing'),
        ('advertising', 'Advertising'),
        ('broadcasting', 'Broadcasting'),
        ('film_and_tv_production', 'Film and TV Production'),
        ('social_media_management', 'Social Media Management'),
        
        # Arts et design
        ('graphic_design', 'Graphic Design'),
        ('music', 'Music'),
        ('fine_arts', 'Fine Arts'),
        ('fashion_design', 'Fashion Design'),
        ('photography', 'Photography'),
        ('game_design', 'Game Design'),
        ('performing_arts', 'Performing Arts'),
        
        # Services
        ('hospitality', 'Hospitality'),
        ('culinary_arts', 'Culinary Arts'),
        ('tourism', 'Tourism'),
        ('event_planning', 'Event Planning'),
        ('beauty_and_wellness', 'Beauty and Wellness'),
        ('fitness_and_sports', 'Fitness and Sports'),
        ('customer_service', 'Customer Service'),
        
        # Transport et logistique
        ('aviation', 'Aviation'),
        ('maritime', 'Maritime'),
        ('logistics', 'Logistics'),
        ('transportation', 'Transportation'),
        ('shipping', 'Shipping'),
        ('railway', 'Railway'),
        
        # Sciences
        ('biology', 'Biology'),
        ('chemistry', 'Chemistry'),
        ('physics', 'Physics'),
        ('astronomy', 'Astronomy'),
        ('geology', 'Geology'),
        ('meteorology', 'Meteorology'),
        ('oceanography', 'Oceanography'),
        ('environmental_science', 'Environmental Science'),
        
        # Secteur public
        ('government', 'Government'),
        ('public_administration', 'Public Administration'),
        ('diplomacy', 'Diplomacy'),
        ('military', 'Military'),
        ('law_enforcement', 'Law Enforcement'),
        ('firefighting', 'Firefighting'),
        ('emergency_services', 'Emergency Services'),
        
        # Agriculture et environnement
        ('agriculture', 'Agriculture'),
        ('forestry', 'Forestry'),
        ('fishing', 'Fishing'),
        ('conservation', 'Conservation'),
        ('renewable_energy', 'Renewable Energy'),
        ('horticulture', 'Horticulture'),
        
        # Industrie
        ('manufacturing', 'Manufacturing'),
        ('automotive', 'Automotive'),
        ('textiles', 'Textiles'),
        ('food_production', 'Food Production'),
        ('petroleum', 'Petroleum'),
        ('mining', 'Mining'),
        ('pharmaceuticals', 'Pharmaceuticals'),
        
        # Social et communautaire
        ('social_work', 'Social Work'),
        ('counseling', 'Counseling'),
        ('community_development', 'Community Development'),
        ('non_profit', 'Non-Profit'),
        ('religious', 'Religious'),
        ('volunteer_management', 'Volunteer Management'),
        
        # Autres
        ('research', 'Research'),
        ('translation', 'Translation'),
        ('interpretation', 'Interpretation'),
        ('museum_and_heritage', 'Museum and Heritage'),
        ('library_science', 'Library Science'),
        ('career_counseling', 'Career Counseling'),
    ]
    
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='lessons')
    lesson_type = models.CharField(max_length=100, choices=LESSON_TYPE, blank=False, null=False)
    professional_field = models.CharField(max_length=100, choices=PROFESSIONAL_CHOICES, blank=True, null=True)
    title_en = models.CharField(max_length=255, blank=False, null=False)
    title_fr = models.CharField(max_length=255, blank=False, null=False)
    title_es = models.CharField(max_length=255, blank=False, null=False)
    title_nl = models.CharField(max_length=255, blank=False, null=False)
    description_en = models.TextField(blank=True, null=True)
    description_fr = models.TextField(blank=True, null=True)
    description_es = models.TextField(blank=True, null=True)
    description_nl = models.TextField(blank=True, null=True)
    estimated_duration = models.IntegerField(default=0, help_text="In minutes")
    order = models.PositiveIntegerField(blank=False, null=False, default=1)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.unit} - {self.unit.title_en} - {self.title_en} - {self.lesson_type}"

    def get_title(self, target_language='en'):
        if target_language == 'fr':
            return self.title_fr
        elif target_language == 'es':
            return self.title_es
        elif target_language == 'nl':
            return self.title_nl
        else:
            return self.title_en

    def get_description(self, target_language):
        switch = {
            'fr': self.description_fr,
            'es': self.description_es,
            'nl': self.description_nl,
        }
        return switch.get(target_language, self.description_en)

    def calculate_duration_lesson(self):
        """
        Calculate the total estimated duration of all content lessons associated with this lesson.
        
        Returns:
            int: Total estimated duration in minutes
        """
        total_duration = self.content_lessons.aggregate(
            total_duration=models.Sum('estimated_duration')
        )['total_duration'] or 0
        
        return total_duration

    def clean(self):
        if self.lesson_type == 'professional' and not self.professional_field:
            raise ValidationError({'professional_field': _('This field is required when lesson type is professional.')})
        if self.lesson_type != 'professional' and self.professional_field:
            self.professional_field = None
        
    def save(self, *args, **kwargs):
        if self.pk:
            total_duration = self.calculate_duration_lesson()
            self.estimated_duration = max(int(total_duration or 0), 0)
        super().save(*args, **kwargs)
        if not self.pk:
            self.estimated_duration = 0
    
class ContentLesson(models.Model):
    '''
    Content lesson model
    This is the area where the content of the lesson is stored.
    While you have created a lesson, you can add content to it.
    For instance, you can add a theory, vocabulary, grammar, etc. ==> titre= "Vocabulaire, Théorie, Un point de Grammaire, etc."    
    '''

    CONTENT_TYPE = [
        ('Theory', 'Theory'),
        ('VocabularyList', 'VocabularyList'),
        ('Grammar', 'Grammar'),
        ('Multiple choice', 'Multiple choice'),
        ('Numbers', 'Numbers'),
        ('Reordering', 'Reordering'),
        ('Matching', 'Matching'),
        ('Speaking', 'Speaking'),
        ('Question and answer', 'Question and answer'),
        ('fill_blank', 'Fill in the blanks'),
        ('True or False', 'True or False'),
        ('Test', 'Test'),
    ]
        
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='content_lessons')
    content_type = models.CharField(max_length=100, choices=CONTENT_TYPE, blank=False, null=False, db_index=True)
    title_en = models.CharField(max_length=255, blank=False, null=False)
    title_fr = models.CharField(max_length=255, blank=False, null=False)
    title_es = models.CharField(max_length=255, blank=False, null=False)
    title_nl = models.CharField(max_length=255, blank=False, null=False)
    instruction_en = models.TextField(blank=False, null=False, default='Text of the instruction')
    instruction_fr = models.TextField(blank=False, null=False, default='Text of the instruction')
    instruction_es = models.TextField(blank=False, null=False, default='Text of the instruction')
    instruction_nl = models.TextField(blank=False, null=False, default='Text of the instruction')
    estimated_duration = models.IntegerField(help_text="Duration in minutes", validators=[MinValueValidator(1)], blank=False, null=False)
    order = models.PositiveIntegerField(blank=False, validators=[MinValueValidator(1)],null=False, default=1)

    class Meta:
        ordering = ['order', 'id']
        verbose_name= "Content Lesson"
        verbose_name_plural = "Content Lessons"
        indexes = [
            models.Index(fields=['content_type']),
            models.Index(fields=['order']),
        ]


    def __str__(self):
        return f"{self.lesson.title_en} - {self.title_en} - {self.content_type} - {self.order}"
    
    def get_title(self, target_language='en'):
        """
        Get the title in the specified language.
        
        Args:
            target_language (str): Language code ('en', 'fr', 'es', or 'nl')
            
        Returns:
            str: Title in the requested language
        """
        return getattr(self, f'title_{target_language}', self.title_en)

    def get_instruction(self, target_language='en'):
        """
        Get the instruction in the specified language.
        
        Args:
            target_language (str): Language code ('en', 'fr', 'es', or 'nl')
            
        Returns:
            str: Instruction in the requested language
        """
        return getattr(self, f'instruction_{target_language}', self.instruction_en)

  
    def save(self, *args, **kwargs):
        """Override save to ensure content type is lowercase and validate duration"""
        self.content_type = self.content_type.lower()
        if self.estimated_duration < 1:
            self.estimated_duration = 1
        super().save(*args, **kwargs)

''' This section if for the content of the lesson of Linguify
    The content of the lesson can be a theory, vocabulary, grammar, multiple choice, numbers, reordering, matching, question and answer, fill in the blanks, true or false, test, etc.
    The content of the lesson is stored in the ContentLesson model.
    The content of the lesson can be in different languages: English, French, Spanish, Dutch.
'''
  
class VocabularyList(models.Model):

    content_lesson = models.ForeignKey(ContentLesson, on_delete=models.CASCADE, related_name='vocabulary_lists', default=1)
    word_en = models.CharField(max_length=100, blank=False, null=False)
    word_fr = models.CharField(max_length=100, blank=False, null=False)
    word_es = models.CharField(max_length=100, blank=False, null=False)
    word_nl = models.CharField(max_length=100, blank=False, null=False)
    definition_en = models.TextField(blank=False, null=False)
    definition_fr = models.TextField(blank=False, null=False)
    definition_es = models.TextField(blank=False, null=False)
    definition_nl = models.TextField(blank=False, null=False)
    example_sentence_en = models.TextField(blank=True, null=True)
    example_sentence_fr = models.TextField(blank=True, null=True)
    example_sentence_es = models.TextField(blank=True, null=True)
    example_sentence_nl = models.TextField(blank=True, null=True)
    word_type_en = models.CharField(max_length=100, blank=False, null=False)
    word_type_fr = models.CharField(max_length=100, blank=False, null=False)
    word_type_es = models.CharField(max_length=100, blank=False, null=False)
    word_type_nl = models.CharField(max_length=100, blank=False, null=False)
    synonymous_en = models.TextField(blank=True, null=True)
    synonymous_fr = models.TextField(blank=True, null=True)
    synonymous_es = models.TextField(blank=True, null=True)
    synonymous_nl = models.TextField(blank=True, null=True)
    antonymous_en = models.TextField(blank=True, null=True)
    antonymous_fr = models.TextField(blank=True, null=True)
    antonymous_es = models.TextField(blank=True, null=True)
    antonymous_nl = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.id} - {self.content_lesson} - {self.word_en} - {self.definition_en}"

    def get_translation(self, target_language):
        switch = {
            'fr': self.word_fr,
            'es': self.word_es,
            'nl': self.word_nl,
        }
        return switch.get(target_language, self.word_en)

    def get_example_sentence(self, target_language):
        switch = {
            'fr': self.example_sentence_fr,
            'es': self.example_sentence_es,
            'nl': self.example_sentence_nl,
        }
        return switch.get(target_language, self.example_sentence_en)

    def get_definition(self, target_language):
        switch = {
            'fr': self.definition_fr,
            'es': self.definition_es,
            'nl': self.definition_nl,
        }
        return switch.get(target_language, self.definition_en)
    
    def get_word_type(self, target_language):
        switch = {
            'fr': self.word_type_fr,
            'es': self.word_type_es,
            'nl': self.word_type_nl,
        }
        return switch.get(target_language, self.word_type_en)
    
    def get_synonymous(self, target_language):
        switch = {
            'fr': self.synonymous_fr,
            'es': self.synonymous_es,
            'nl': self.synonymous_nl,
        }
        return switch.get(target_language, self.synonymous_en)
    
    def get_antonymous(self, target_language):
        switch = {
            'fr': self.antonymous_fr,
            'es': self.antonymous_es,
            'nl': self.antonymous_nl,
        }
        return switch.get(target_language, self.antonymous_en)
    
class MultipleChoiceQuestion(models.Model):
    content_lesson = models.ForeignKey(ContentLesson, on_delete=models.CASCADE, related_name='multiple_choices', default=1)
    # example of question Level A1: What is the capital of Belgium?
    question_en = models.CharField(max_length=255, blank=False, null=False)
    question_fr = models.CharField(max_length=255, blank=False, null=False)
    question_es = models.CharField(max_length=255, blank=False, null=False)
    question_nl = models.CharField(max_length=255, blank=False, null=False)
    # example of correct answer Level A1: Brussels
    correct_answer_en = models.CharField(max_length=255, blank=False, null=False)

    fake_answer1_en = models.CharField(max_length=255, blank=False, null=False)
    fake_answer2_en = models.CharField(max_length=255, blank=False, null=False)
    fake_answer3_en = models.CharField(max_length=255, blank=False, null=False)
    fake_answer4_en = models.CharField(max_length=255, blank=False, null=False)

    hint_answer_en = models.CharField(max_length=255, blank=True, null=True)
    # example of correct answer Level A1: Bruxelles
    correct_answer_fr = models.CharField(max_length=255, blank=False, null=False)

    fake_answer1_fr = models.CharField(max_length=255, blank=False, null=False)
    fake_answer2_fr = models.CharField(max_length=255, blank=False, null=False)
    fake_answer3_fr = models.CharField(max_length=255, blank=False, null=False)
    fake_answer4_fr = models.CharField(max_length=255, blank=False, null=False)

    hint_answer_fr = models.CharField(max_length=255, blank=True, null=True)
    # example of correct answer Level A1: Bruselas
    correct_answer_es = models.CharField(max_length=255, blank=False, null=False)

    fake_answer1_es = models.CharField(max_length=255, blank=False, null=False)
    fake_answer2_es = models.CharField(max_length=255, blank=False, null=False)
    fake_answer3_es = models.CharField(max_length=255, blank=False, null=False)
    fake_answer4_es = models.CharField(max_length=255, blank=False, null=False)

    hint_answer_es = models.CharField(max_length=255, blank=True, null=True)

    # example of correct answer Level A1: Brussel
    correct_answer_nl = models.CharField(max_length=255, blank=False, null=False)

    fake_answer1_nl = models.CharField(max_length=255, blank=False, null=False)
    fake_answer2_nl = models.CharField(max_length=255, blank=False, null=False)
    fake_answer3_nl = models.CharField(max_length=255, blank=False, null=False)
    fake_answer4_nl = models.CharField(max_length=255, blank=False, null=False)

    hint_answer_nl = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.content_lesson} - {self.question_en}"
    
class Numbers(models.Model):
    content_lesson = models.ForeignKey(ContentLesson, on_delete=models.CASCADE, related_name='numbers', default=1)
    number = models.CharField(max_length=255, blank=False, null=False)
    number_en = models.CharField(max_length=255, blank=False, null=False)
    number_fr = models.CharField(max_length=255, blank=False, null=False)
    number_es = models.CharField(max_length=255, blank=False, null=False)
    number_nl = models.CharField(max_length=255, blank=False, null=False)
    is_reviewed = models.BooleanField(default=False, blank=False, null=False)

    def __str__(self):
        return f"{self.content_lesson} - {self.content_lesson.title_en} - {self.number} - {self.number_en} - {self.is_reviewed}"  

class ExerciseVocabularyMultipleChoice(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE)
    question = models.TextField(blank=False, null=False, help_text="Question based on example sentence")
    correct_answer = models.CharField(max_length=255, blank=False, null=False, help_text="Correct answer from vocabulary")
    incorrect_answers = models.JSONField(blank=False, null=False, help_text="List of incorrect answers")
    explanation = models.TextField(blank=True, null=True, help_text="Explanation for the correct answer")

    def __str__(self):
        return f"{self.lesson.title_en} - {self.question}"
    
    @classmethod
    def create_from_vocabulary(cls, lesson, vocab):
        return cls(
            lesson=lesson,
            question=vocab.example_sentence_en,
            correct_answer=vocab.word_en,
            incorrect_answers=[vocab.word_fr, vocab.word_es, vocab.word_nl],
            explanation=f"{vocab.word_en} means {vocab.definition_en}",
        )

class MatchingExercise(models.Model):
    """
    Modèle pour les exercices d'association entre mots en langue cible et langue native.
    
    Les instructions sont standardisées et calculées dynamiquement pour toutes les instances,
    indépendamment de leur identifiant. Cela assure une expérience utilisateur cohérente
    tout en réduisant la complexité de gestion des données.
    """
    # Relation avec la leçon
    content_lesson = models.ForeignKey(
        ContentLesson, 
        on_delete=models.CASCADE, 
        related_name='matching_exercises',
        verbose_name="Leçon associée"
    )
    
    # Paramètres de configuration
    difficulty = models.CharField(
        max_length=10, 
        choices=[('easy', 'Easy'), ('medium', 'Medium'), ('hard', 'Hard')],
        default='medium',
        verbose_name="Difficulté",
        help_text="Niveau de difficulté de l'exercice"
    )
    
    order = models.PositiveIntegerField(
        default=1, 
        validators=[MinValueValidator(1)],
        verbose_name="Ordre",
        help_text="Position de l'exercice dans la séquence de leçon"
    )
    
    # Titres personnalisables (contrairement aux instructions qui sont standardisées)
    title_en = models.CharField(
        max_length=255, 
        default="Match words with their translations",
        verbose_name="Titre (EN)"
    )
    
    title_fr = models.CharField(
        max_length=255, 
        default="Associez les mots à leurs traductions",
        verbose_name="Titre (FR)"
    )
    
    title_es = models.CharField(
        max_length=255, 
        default="Relaciona las palabras con sus traducciones",
        verbose_name="Titre (ES)"
    )
    
    title_nl = models.CharField(
        max_length=255, 
        default="Koppel woorden aan hun vertalingen",
        verbose_name="Titre (NL)"
    )
    
    # Configuration de l'exercice
    vocabulary_words = models.ManyToManyField(
        VocabularyList, 
        related_name='used_in_matching_exercises',
        verbose_name="Mots de vocabulaire",
        help_text="Sélectionnez les mots à inclure dans cet exercice"
    )
    
    pairs_count = models.PositiveIntegerField(
        default=8,
        validators=[MinValueValidator(4), MaxValueValidator(20)],
        verbose_name="Nombre de paires",
        help_text="Nombre maximal de paires mot-traduction à afficher"
    )
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Dernière modification")
    
    class Meta:
        ordering = ['content_lesson', 'order']
        verbose_name = "Matching Exercise"
        verbose_name_plural = "Matching Exercises"
        indexes = [
            models.Index(fields=['content_lesson', 'order']),
            models.Index(fields=['difficulty']),
        ]
    
    def __str__(self):
        return f"Association - {self.content_lesson.title_en} ({self.order})"
    
    # Instructions standardisées sous forme de propriétés calculées
    @property
    def instruction_en(self):
        return "Match each word in the language you're learning with its translation in your native language. Drag the items to create pairs."
    
    @property
    def instruction_fr(self):
        return "Associez chaque mot dans la langue que vous apprenez avec sa traduction dans votre langue maternelle. Faites glisser les éléments pour créer des paires."
    
    @property
    def instruction_es(self):
        return "Relaciona cada palabra en el idioma que estás aprendiendo con su traducción en tu idioma nativo. Arrastra los elementos para crear pares."
    
    @property
    def instruction_nl(self):
        return "Koppel elk woord in de taal die je leert aan de vertaling in je moedertaal. Sleep de items om paren te maken."
    
    def get_title(self, language_code='en'):
        field_name = f'title_{language_code}'
        return getattr(self, field_name, self.title_en)
    
    def get_instruction(self, language_code='en'):
        property_name = f'instruction_{language_code}'
        if hasattr(self, property_name):
            return getattr(self, property_name)
        return self.instruction_en  # Fallback sur l'anglais
    
    def get_matching_pairs(self, native_language='en', target_language='fr'):
        """
        Génère les paires de mots à associer entre la langue cible et la langue native.
        Version améliorée avec meilleure gestion des erreurs et valeurs par défaut.
        
        Args:
            native_language (str): Code de la langue maternelle de l'utilisateur
            target_language (str): Code de la langue que l'utilisateur apprend
            
        Returns:
            tuple: (target_words, native_words, correct_pairs)
                - target_words: Liste des mots dans la langue cible
                - native_words: Liste des mots dans la langue native (mélangés)
                - correct_pairs: Dictionnaire de correspondance {target_word: native_word}
        """
        import random
        import logging
        logger = logging.getLogger(__name__)
        
        # Vérifier que les langues sont valides
        supported_languages = ['en', 'fr', 'es', 'nl']
        if native_language not in supported_languages:
            logger.warning(f"Unsupported native language: {native_language}, falling back to 'en'")
            native_language = 'en'
        if target_language not in supported_languages:
            logger.warning(f"Unsupported target language: {target_language}, falling back to 'fr'")
            target_language = 'fr'
        
        # Éviter que les deux langues soient identiques
        if native_language == target_language:
            logger.warning(f"Native and target languages are the same ({native_language}), using 'fr' as target language")
            if native_language == 'fr':
                target_language = 'en'
            else:
                target_language = 'fr'
        
        # Obtenir les mots de vocabulaire pour l'exercice
        vocabulary_items = self.vocabulary_words.all()
        
        # Vérifier qu'il y a des mots de vocabulaire associés
        if not vocabulary_items.exists():
            logger.error(f"No vocabulary words associated with matching exercise ID: {self.id}")
            # Renvoyer des listes vides plutôt que de planter
            return [], [], {}
        
        # Si le nombre d'éléments dépasse pairs_count, sélectionner aléatoirement
        vocab_count = vocabulary_items.count()
        if vocab_count > self.pairs_count:
            try:
                # Convertir en liste pour pouvoir utiliser random.sample
                vocabulary_items = list(vocabulary_items)
                vocabulary_items = random.sample(vocabulary_items, self.pairs_count)
            except Exception as e:
                logger.error(f"Error sampling vocabulary items: {str(e)}")
                # Prendre les premiers elements comme fallback
                vocabulary_items = list(vocabulary_items)[:self.pairs_count]
        
        # Générer les paires de mots
        target_words = []
        native_words = []
        correct_pairs = {}
        
        # Log pour debugging
        logger.debug(f"Processing {len(vocabulary_items)} vocabulary items for matching exercise")
        
        # Collecter toutes les paires valides
        for vocab in vocabulary_items:
            try:
                # Récupérer le mot dans la langue cible
                target_field = f'word_{target_language}'
                target_word = getattr(vocab, target_field, None)
                
                # Récupérer le mot dans la langue native
                native_field = f'word_{native_language}'
                native_word = getattr(vocab, native_field, None)
                
                # Log pour debugging
                logger.debug(f"Processing vocab ID {vocab.id}: target ({target_field})='{target_word}', native ({native_field})='{native_word}'")
                
                # Vérifier que les deux valeurs sont disponibles
                if target_word and native_word:
                    # Éviter les doublons (en cas de mots identiques dans différentes langues)
                    if target_word not in target_words and native_word not in native_words:
                        target_words.append(target_word)
                        native_words.append(native_word)
                        correct_pairs[target_word] = native_word
                else:
                    logger.warning(f"Missing translation for vocab ID {vocab.id}: target='{target_word}', native='{native_word}'")
            except Exception as e:
                logger.error(f"Error processing vocabulary item {vocab.id}: {str(e)}")
                # Continuer avec le prochain item plutôt que de planter
                continue
        
        # Vérifier qu'on a au moins une paire
        if not target_words:
            logger.error(f"No valid word pairs found for languages: {native_language} (native) and {target_language} (target)")
            return [], [], {}
        
        # Mélanger la liste des mots natifs pour l'exercice
        shuffled_native_words = native_words.copy()
        random.shuffle(shuffled_native_words)
        
        return target_words, shuffled_native_words, correct_pairs
    
    def get_exercise_data(self, native_language='en', target_language='fr'):
        """
        Prépare toutes les données formatées nécessaires pour l'exercice.
        
        Args:
            native_language (str): Code de la langue maternelle de l'utilisateur
            target_language (str): Code de la langue que l'utilisateur apprend
            
        Returns:
            dict: Données formatées pour l'API
        """
        # Récupérer les paires de mots
        target_words, shuffled_native_words, correct_pairs = self.get_matching_pairs(
            native_language, target_language
        )
        
        # Construire la réponse complète
        return {
            'id': self.id,
            'title': self.get_title(native_language),
            'instruction': self.get_instruction(native_language),
            'difficulty': self.difficulty,
            'target_language': target_language,
            'native_language': native_language,
            'target_language_name': self._get_language_name(target_language),
            'native_language_name': self._get_language_name(native_language),
            'target_words': target_words,
            'native_words': shuffled_native_words,
            'correct_pairs': correct_pairs,
            'total_pairs': len(target_words)
        }
    
    def _get_language_name(self, language_code):
        """
        Traduit un code de langue en nom complet.
        
        Args:
            language_code (str): Code de langue ('en', 'fr', 'es', 'nl')
            
        Returns:
            str: Nom complet de la langue
        """
        language_names = {
            'en': 'English',
            'fr': 'French',
            'es': 'Spanish',
            'nl': 'Dutch'
        }
        return language_names.get(language_code, 'Unknown')
    
    @classmethod
    def create_from_content_lesson(cls, content_lesson, vocabulary_ids=None, pairs_count=8):
        """
        Crée un nouvel exercice d'association à partir d'une leçon et de mots de vocabulaire.
        
        Args:
            content_lesson: L'instance ContentLesson à associer
            vocabulary_ids: Liste des IDs de vocabulaire à inclure (optionnel)
            pairs_count: Nombre maximal de paires à inclure
            
        Returns:
            MatchingExercise: L'instance nouvellement créée
        """
        # Déterminer l'ordre du nouvel exercice
        order = cls.objects.filter(content_lesson=content_lesson).count() + 1
        
        # Créer l'exercice
        exercise = cls.objects.create(
            content_lesson=content_lesson,
            title_en=f"Matching Exercise - {content_lesson.title_en}",
            title_fr=f"Exercice d'association - {content_lesson.title_fr}",
            title_es=f"Ejercicio de correspondencia - {content_lesson.title_es}",
            title_nl=f"Matching oefening - {content_lesson.title_nl}",
            pairs_count=pairs_count,
            difficulty='medium',  # Valeur par défaut
            order=order
        )
        
        # Ajouter le vocabulaire à l'exercice
        if vocabulary_ids:
            vocabulary_items = VocabularyList.objects.filter(id__in=vocabulary_ids)
        else:
            vocabulary_items = VocabularyList.objects.filter(content_lesson=content_lesson)
        
        # Limiter au nombre spécifié
        for vocab in vocabulary_items[:pairs_count]:
            exercise.vocabulary_words.add(vocab)
        
        return exercise

class SpeakingExercise(models.Model):
    content_lesson = models.ForeignKey(ContentLesson, on_delete=models.CASCADE, related_name='speaking_exercises')
    vocabulary_items = models.ManyToManyField(VocabularyList, related_name='speaking_exercises', verbose_name="Vocabulary Items", help_text="Vocabulary items to practice speaking")

    class Meta:
        ordering = ['content_lesson', 'id']
        verbose_name = "Speaking Exercise"
        verbose_name_plural = "Speaking Exercises"
    
    def __str__(self):
        return f"{self.content_lesson} - Speaking Exercise"
   

''' GRAMMAR LESSON :
This section is for the content of the lessson related to the grammar of Linguify.
A lesson of grammar can contain a theory, exercises, and a test.
'''

class TheoryContent(models.Model):
    '''
    Model for grammar theory content with explanations, formulas, exceptions, and examples.
    Amélioré avec des champs JSON pour une gestion plus flexible des langues.
    '''
    content_lesson = models.OneToOneField(ContentLesson, on_delete=models.CASCADE, related_name='theory_content', default=1)
    
    content_en = models.TextField(blank=False, null=False)
    content_fr = models.TextField(blank=False, null=False)
    content_es = models.TextField(blank=False, null=False)
    content_nl = models.TextField(blank=False, null=False)
    explication_en = models.TextField(blank=False, null=False)
    explication_fr = models.TextField(blank=False, null=False)
    explication_es = models.TextField(blank=False, null=False)
    explication_nl = models.TextField(blank=False, null=False)
    formula_en = models.TextField(blank=True, null=True)
    formula_fr = models.TextField(blank=True, null=True)
    formula_es = models.TextField(blank=True, null=True)
    formula_nl = models.TextField(blank=True, null=True)
    example_en = models.TextField(blank=True, null=True)
    example_fr = models.TextField(blank=True, null=True)
    example_es = models.TextField(blank=True, null=True)
    example_nl = models.TextField(blank=True, null=True)
    exception_en = models.TextField(blank=True, null=True)
    exception_fr = models.TextField(blank=True, null=True)
    exception_es = models.TextField(blank=True, null=True)
    exception_nl = models.TextField(blank=True, null=True)

    available_languages = models.JSONField(
        default=list,
        blank=True,
        help_text="Liste des codes de langue pour lesquelles ce contenu est disponible"
    )
    
    language_specific_content = models.JSONField(
        default=dict,
        blank=True,
        help_text="Contenu spécifique à une langue qui n'existe pas dans les autres langues"
    )
    
    using_json_format = models.BooleanField(
        default=False,
        help_text="Indique si cette théorie utilise le nouveau format JSON"
    )
    
    def __str__(self):
        return f"{self.content_lesson} - Grammar Content"
    
    def get_content(self, target_language):
        """
        Récupère le contenu pour la langue cible.
        Prend en charge à la fois l'ancien et le nouveau format.
        """
        
        if self.using_json_format and target_language in self.language_specific_content:
            return self.language_specific_content.get(target_language, {}).get('content', '')
            
        switch = {
            'fr': self.content_fr,
            'es': self.content_es,
            'nl': self.content_nl,
        }
        return switch.get(target_language, self.content_en)
        
    def get_explanation(self, target_language):
        """
        Récupère l'explication pour la langue cible.
        Prend en charge à la fois l'ancien et le nouveau format.
        """
        if self.using_json_format and target_language in self.language_specific_content:
            return self.language_specific_content.get(target_language, {}).get('explanation', '')
            
        switch = {
            'fr': self.explication_fr,
            'es': self.explication_es,
            'nl': self.explication_nl,
        }
        return switch.get(target_language, self.explication_en)

    def get_formula(self, target_language):
        if self.using_json_format and target_language in self.language_specific_content:
            return self.language_specific_content.get(target_language, {}).get('formula', '')
            
        switch = {
            'fr': self.formula_fr,
            'es': self.formula_es,
            'nl': self.formula_nl,
        }
        return switch.get(target_language, self.formula_en)
    
    def get_example(self, target_language):
        if self.using_json_format and target_language in self.language_specific_content:
            return self.language_specific_content.get(target_language, {}).get('example', '')
            
        switch = {
            'fr': self.example_fr,
            'es': self.example_es,
            'nl': self.example_nl,
        }
        return switch.get(target_language, self.example_en)
    
    def get_exception(self, target_language):
        if self.using_json_format and target_language in self.language_specific_content:
            return self.language_specific_content.get(target_language, {}).get('exception', '')
            
        switch = {
            'fr': self.exception_fr,
            'es': self.exception_es,
            'nl': self.exception_nl,
        }
        return switch.get(target_language, self.exception_en)
        
    def migrate_to_json_format(self):
        """
        Convertit les données des champs traditionnels vers le format JSON
        sans perdre les données existantes.
        """
        available_langs = []
        for lang in ['en', 'fr', 'es', 'nl']:
            content_field = f'content_{lang}'
            if getattr(self, content_field):
                available_langs.append(lang)
        
        language_content = {}
        
        for lang in available_langs:
            language_content[lang] = {
                'content': getattr(self, f'content_{lang}', ''),
                'explanation': getattr(self, f'explication_{lang}', ''),
                'formula': getattr(self, f'formula_{lang}', ''),
                'example': getattr(self, f'example_{lang}', ''),
                'exception': getattr(self, f'exception_{lang}', '')
            }
        
        self.available_languages = available_langs
        self.language_specific_content = language_content
        self.using_json_format = True
        
        self.save()
        
        return True
    
    def add_language_content(self, language_code, content_data):
        """
        Ajoute ou met à jour le contenu pour une langue spécifique
        en utilisant le nouveau format JSON.
        
        Args:
            language_code (str): Code de langue (en, fr, es, nl, etc.)
            content_data (dict): Dictionnaire contenant le contenu pour cette langue
        """
        if not self.using_json_format:
            self.migrate_to_json_format()
        
        if language_code not in self.available_languages:
            self.available_languages.append(language_code)
        
        self.language_specific_content[language_code] = content_data
        
        self.save()
        
        return True

class ExerciseGrammarReordering(models.Model):
    content_lesson = models.ForeignKey(ContentLesson, on_delete=models.CASCADE, related_name='reordering', default=1)
    sentence_en = models.TextField(blank=False, null=False, help_text="Sentence to reorder")
    sentence_fr = models.TextField(blank=False, null=False, help_text="Sentence to reorder")
    sentence_es = models.TextField(blank=False, null=False, help_text="Sentence to reorder")
    sentence_nl = models.TextField(blank=False, null=False, help_text="Sentence to reorder")
    explanation = models.TextField(blank=True, null=True, help_text="Explanation for the correct order")
    hint = models.TextField(blank=True, null=True, help_text="Hint to help the user")

    def __str__(self):
        return f"{self.content_lesson} - {self.sentence_en}"

class FillBlankExercise(models.Model):
    """
    Modèle pour les exercices de type "fill in the blank" multilingues.
    L'utilisateur doit choisir la bonne option pour remplir un trou dans une phrase.
    """
    # Relation avec ContentLesson
    content_lesson = models.ForeignKey('ContentLesson', on_delete=models.CASCADE, related_name='fill_blank_exercises')
    
    # Position dans la séquence d'exercices
    order = models.PositiveIntegerField(
        default=1, 
        validators=[MinValueValidator(1)],
        help_text="Ordre d'affichage de l'exercice"
    )
    
    # Instructions multilingues
    # Format: {"en": "Select the right answer", "fr": "Sélectionnez la bonne réponse", ...}
    instructions = models.JSONField(
        default=dict,
        help_text="Instructions dans différentes langues"
    )
    
    # Phrases avec marqueur pour indiquer l'emplacement du trou
    # Format: {"en": "Paris ___ in England. It's in France.", "fr": "Paris ___ en Angleterre. C'est en France.", ...}
    sentences = models.JSONField(help_text="Phrases avec emplacement marqué pour le trou (utiliser ___ pour indiquer l'emplacement)")
    
    # Options de réponse pour chaque langue
    # Format: {"en": ["is not", "are not", "am not"], "fr": ["n'est pas", "ne sont pas", "ne suis pas"], ...}
    answer_options = models.JSONField(help_text="Options de réponse pour chaque langue")
    
    # Réponses correctes pour chaque langue
    # Format: {"en": "is not", "fr": "n'est pas", ...}
    correct_answers = models.JSONField(
        help_text="Réponse correcte pour chaque langue"
    )
    
    # Indices optionnels pour aider l'utilisateur
    # Format: {"en": "Use the singular form", "fr": "Utilisez la forme singulière", ...}
    hints = models.JSONField(
        null=True,
        blank=True,
        help_text="Indices optionnels"
    )
    
    # Explications pour la réponse correcte
    # Format: {"en": "Paris is a city, so we use 'is not'", "fr": "Paris est une ville, donc on utilise 'n'est pas'", ...}
    explanations = models.JSONField(
        null=True,
        blank=True,
        help_text="Explications pour la réponse correcte"
    )
    
    # Niveau de difficulté
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard')
    ]
    difficulty = models.CharField(
        max_length=10,
        choices=DIFFICULTY_CHOICES,
        default='medium'
    )
    
    # Tags pour la catégorisation
    tags = models.JSONField(
        default=list,
        blank=True,
        help_text="Tags pour catégoriser l'exercice"
    )
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['content_lesson', 'order']
        verbose_name = "Fill in the Blank Exercise"
        verbose_name_plural = "Fill in the Blank Exercises"
        indexes = [
            models.Index(fields=['content_lesson', 'order']),
            models.Index(fields=['difficulty']),
        ]
    
    def __str__(self):
        return f"Fill in the Blank - Lesson {self.content_lesson_id} - {self.order}"
    
    def get_available_languages(self):
        """Renvoie la liste des langues disponibles pour cet exercice"""
        # Une langue est considérée disponible si elle a une phrase et des options de réponse
        return [lang for lang in self.sentences.keys() 
                if lang in self.answer_options and lang in self.correct_answers]
    
    def get_content_for_language(self, language_code='en'):
        """
        Récupère tout le contenu pour une langue spécifique
        
        Args:
            language_code (str): Code de langue (ex: 'en', 'fr')
            
        Returns:
            dict: Contenu formaté pour l'exercice dans la langue spécifiée
        """
        # Si la langue demandée n'est pas disponible, utiliser l'anglais comme fallback
        fallback = 'en'
        
        # Vérifier si la langue est disponible
        available_languages = self.get_available_languages()
        if language_code not in available_languages:
            language_code = fallback if fallback in available_languages else available_languages[0]
        
        return {
            'instruction': self.instructions.get(language_code, self.instructions.get(fallback, "Select the right answer")),
            'sentence': self.sentences.get(language_code, self.sentences.get(fallback, "")),
            'options': self.answer_options.get(language_code, self.answer_options.get(fallback, [])),
            'correct_answer': self.correct_answers.get(language_code, self.correct_answers.get(fallback, "")),
            'hint': self.hints.get(language_code, self.hints.get(fallback, "")) if self.hints else "",
            'explanation': self.explanations.get(language_code, self.explanations.get(fallback, "")) if self.explanations else ""
        }
    
    def check_answer(self, user_answer, language_code='en'):
        """
        Vérifie si la réponse de l'utilisateur est correcte
        
        Args:
            user_answer (str): Réponse fournie par l'utilisateur
            language_code (str): Code de langue
            
        Returns:
            bool: True si la réponse est correcte, False sinon
        """
        correct = self.correct_answers.get(language_code, self.correct_answers.get('en', ""))
        return user_answer.strip() == correct.strip()
    
    def format_sentence_with_blank(self, language_code='en'):
        """Renvoie la phrase avec un trou (___) visible"""
        return self.sentences.get(language_code, self.sentences.get('en', ""))
    
    def format_sentence_with_answer(self, language_code='en'):
        """Renvoie la phrase avec la réponse correcte insérée"""
        sentence = self.sentences.get(language_code, self.sentences.get('en', ""))
        answer = self.correct_answers.get(language_code, self.correct_answers.get('en', ""))
        return sentence.replace('___', answer)

''' Others models for the content of the lesson of Linguify
'''

class Grammar(models.Model):
    title = models.CharField(max_length=100, blank=False, null=False)
    description = models.TextField(blank=False, null=False)
    example = models.TextField(blank=False, null=False)

    def __str__(self):
        return self.title

class GrammarRulePoint(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE)
    title = models.CharField(max_length=100, blank=False, null=False)
    rule = models.TextField(blank=False, null=False)

    def __str__(self):
        return self.title

class Reading(models.Model):
    title = models.CharField(max_length=100, blank=False, null=False)
    text = models.TextField(blank=False, null=False)

    def __str__(self):
        return self.title

class Writing(models.Model):
    title = models.CharField(max_length=100, blank=False, null=False)
    text = models.TextField(blank=False, null=False)

    def __str__(self):
        return self.title

class TestRecap(models.Model):            
    content_lesson = models.ForeignKey(ContentLesson, on_delete=models.CASCADE, related_name='test_recap', null=True)
    title = models.CharField(max_length=100, blank=False, null=False)

    question = models.TextField(blank=False, null=False)
    correct_answer = models.CharField(max_length=100, blank=False, null=False)
    incorrect_answers = models.TextField(blank=False, null=False, help_text="Separate the answers with a comma.")
    passing_score = models.FloatField(default=0.8, blank=False, null=False)

    def __str__(self):
        return self.title

class TestRecapExercise(models.Model):
    test_recap = models.ForeignKey(TestRecap, on_delete=models.CASCADE)
    order = models.PositiveIntegerField(blank=False, null=False, default=1)

class TestRecapAttempt(models.Model):
    test_recap = models.ForeignKey(TestRecap, on_delete=models.CASCADE)
    score = models.FloatField(blank=False, null=False)
    attempt_date = models.DateTimeField(auto_now_add=True)
    test_recap_passed = models.BooleanField(blank=False, null=False)

    def __str__(self):
        return f"{self.test_recap.title} - {self.score}"