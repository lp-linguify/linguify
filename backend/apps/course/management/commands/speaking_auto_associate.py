# backend/apps/course/management/commands/speaking_auto_associate.py
from django.core.management.base import BaseCommand
from course.models import ContentLesson, SpeakingExercise, VocabularyList

class Command(BaseCommand):
    help = 'Automatically associates vocabulary items with speaking exercises'

    def add_arguments(self, parser):
        parser.add_argument('--lesson', type=int, help='Content lesson ID to process (optional, otherwise all speaking lessons)')
        parser.add_argument('--force', action='store_true', help='Force update even if associations already exist')

    def handle(self, *args, **options):
        lesson_id = options.get('lesson')
        force = options.get('force', False)
        
        # Filtrer les leçons à traiter
        if lesson_id:
            content_lessons = ContentLesson.objects.filter(id=lesson_id, content_type__iexact='speaking')
        else:
            content_lessons = ContentLesson.objects.filter(content_type__iexact='speaking')
        
        total_lessons = content_lessons.count()
        self.stdout.write(f"Found {total_lessons} speaking lessons to process")
        
        # Traiter chaque leçon
        for idx, content_lesson in enumerate(content_lessons, 1):
            self.stdout.write(f"Processing [{idx}/{total_lessons}] - Lesson: {content_lesson.title_en}")
            
            # Vérifier si un exercice de speaking existe pour cette leçon
            speaking_exercise = SpeakingExercise.objects.filter(content_lesson=content_lesson).first()
            if not speaking_exercise:
                # Créer un nouvel exercice
                speaking_exercise = SpeakingExercise.objects.create(content_lesson=content_lesson)
                self.stdout.write(f"  ✓ Created new speaking exercise for lesson {content_lesson.id}")
            else:
                self.stdout.write(f"  ✓ Found existing speaking exercise (ID: {speaking_exercise.id})")
                
                # Vérifier si l'exercice a déjà des mots associés
                if speaking_exercise.vocabulary_items.exists() and not force:
                    self.stdout.write(f"  ⚠ Exercise already has {speaking_exercise.vocabulary_items.count()} vocabulary items. Use --force to override.")
                    continue
            
            # Supprimer les associations existantes si force=True
            if force and speaking_exercise.vocabulary_items.exists():
                self.stdout.write(f"  ⚠ Removing {speaking_exercise.vocabulary_items.count()} existing associations")
                speaking_exercise.vocabulary_items.clear()
            
            # Chercher d'abord les mots dans la même leçon
            vocab_items = VocabularyList.objects.filter(content_lesson=content_lesson)
            
            # Si aucun mot trouvé, chercher dans le conteneur (Lesson) parent
            if not vocab_items.exists():
                self.stdout.write(f"  ⚠ No vocabulary items found in content lesson {content_lesson.id}")
                
                # Chercher les leçons de vocabulaire dans la même leçon parent
                parent_lesson = content_lesson.lesson
                vocab_lessons = ContentLesson.objects.filter(
                    lesson=parent_lesson,
                    content_type__iexact='vocabularylist'
                )
                
                if vocab_lessons.exists():
                    for vocab_lesson in vocab_lessons:
                        # Récupérer tous les mots de vocabulaire de ces leçons
                        lesson_vocab = VocabularyList.objects.filter(content_lesson=vocab_lesson)
                        vocab_items = vocab_items | lesson_vocab
                        self.stdout.write(f"  ✓ Found {lesson_vocab.count()} vocabulary items in content lesson {vocab_lesson.id}")
            
            # Associer tous les mots trouvés à l'exercice
            if vocab_items.exists():
                count_before = speaking_exercise.vocabulary_items.count()
                
                # Associer les mots à l'exercice
                speaking_exercise.vocabulary_items.add(*vocab_items)
                
                count_after = speaking_exercise.vocabulary_items.count()
                count_added = count_after - count_before
                
                self.stdout.write(f"  ✓ Added {count_added} vocabulary items to speaking exercise")
            else:
                self.stdout.write(f"  ❌ No vocabulary items found for lesson {content_lesson.id}")
            
        self.stdout.write(self.style.SUCCESS(f"Processed {total_lessons} speaking lessons successfully"))