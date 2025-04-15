# backend/apps/course/management/commands/matching_auto_associate.py
from django.core.management.base import BaseCommand
from course.models import MatchingExercise, ContentLesson, VocabularyList

class Command(BaseCommand):
    help = 'Automatically associate vocabulary items with matching exercises'

    def add_arguments(self, parser):
        parser.add_argument('--lesson', type=int, help='Process only a specific content lesson ID')
        parser.add_argument('--force', action='store_true', help='Replace existing associations instead of preserving them')

    def handle(self, *args, **options):
        specific_lesson = options.get('lesson')
        force_update = options.get('force', False)
        
        # Get matching exercises to process
        exercises_query = MatchingExercise.objects.all()
        if specific_lesson:
            exercises_query = exercises_query.filter(content_lesson_id=specific_lesson)
        
        exercises_count = exercises_query.count()
        self.stdout.write(f"Found {exercises_count} matching exercises to process")
        
        exercises_updated = 0
        words_added = 0
        
        for exercise in exercises_query:
            content_lesson = exercise.content_lesson
            parent_lesson = content_lesson.lesson
            
            # Skip if already has vocabulary and not forcing update
            initial_vocab_count = exercise.vocabulary_words.count()
            if initial_vocab_count > 0 and not force_update:
                self.stdout.write(f"Skipping exercise {exercise.id} - already has {initial_vocab_count} vocabulary items (use --force to replace)")
                continue
            
            # If force update, clear existing associations
            if force_update and initial_vocab_count > 0:
                self.stdout.write(f"Clearing {initial_vocab_count} existing vocabulary items from exercise {exercise.id}")
                exercise.vocabulary_words.clear()
            
            # 1. First try to find vocabulary in the same content lesson
            vocab_items = VocabularyList.objects.filter(content_lesson=content_lesson)
            
            # 2. If no vocabulary, look in vocabulary lessons in the same parent lesson
            if not vocab_items.exists():
                vocab_lessons = ContentLesson.objects.filter(
                    lesson=parent_lesson,
                    content_type__iexact='vocabulary'
                )
                
                # IMPORTANT: Using union for all vocab lessons instead of replacing
                all_vocab = VocabularyList.objects.none()  # Start with empty queryset
                for vocab_lesson in vocab_lessons:
                    lesson_vocab = VocabularyList.objects.filter(content_lesson=vocab_lesson)
                    all_vocab = all_vocab | lesson_vocab
                
                if all_vocab.exists():
                    vocab_items = all_vocab
            
            # Associate vocabulary items - don't limit by pairs_count yet to see if we're finding items
            if vocab_items.exists():
                # Debug output to see what we're finding
                self.stdout.write(f"Found {vocab_items.count()} vocabulary items for exercise {exercise.id}")
                
                # Limit by pairs_count if needed
                if exercise.pairs_count < vocab_items.count():
                    limited_vocab = list(vocab_items)[:exercise.pairs_count]
                    self.stdout.write(f"Limiting to {len(limited_vocab)} items based on pairs_count")
                    exercise.vocabulary_words.add(*limited_vocab)
                else:
                    exercise.vocabulary_words.add(*vocab_items)
                
                # Count how many words were added
                new_vocab_count = exercise.vocabulary_words.count()
                words_added_to_exercise = new_vocab_count - initial_vocab_count
                words_added += words_added_to_exercise
                exercises_updated += 1
                
                self.stdout.write(f"Added {words_added_to_exercise} vocabulary items to exercise {exercise.id}")
            else:
                self.stdout.write(f"No vocabulary items found for exercise {exercise.id} with content_lesson_id={content_lesson.id}, parent_lesson_id={parent_lesson.id}")
        
        # Summary output
        self.stdout.write(self.style.SUCCESS(f"=== Summary ==="))
        self.stdout.write(self.style.SUCCESS(f"Processed {exercises_count} matching exercises"))
        self.stdout.write(self.style.SUCCESS(f"Updated {exercises_updated} exercises"))
        self.stdout.write(self.style.SUCCESS(f"Added {words_added} vocabulary associations"))