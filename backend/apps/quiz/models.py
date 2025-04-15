# backend/django_apps/quiz/models.py
from django.db import models
from django.conf import settings  # Import settings for AUTH_USER_MODEL
from course.models import Unit, Lesson

class Quiz(models.Model):
    quiz_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)  # Use AUTH_USER_MODEL
    word = models.CharField(max_length=100)
    correct_translation = models.CharField(max_length=100)
    options = models.JSONField(default=list)
    correct_answer = models.CharField(max_length=100)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.quiz_id} - {self.user.username} - {self.word} - {self.correct_translation} - {self.correct_answer}"

# this model is used to complete the study app in the backend
# in order to remind the learning path; learning path-> unit -> lesson -> exercise

class QuizQuestion(models.Model):
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE)
    lesson = models.OneToOneField(Lesson, on_delete=models.CASCADE, related_name='quiz')  # Lien avec une leçon
    exercise_type = models.CharField(max_length=100)
    question = models.CharField(max_length=100)
    options = models.CharField(max_length=100)
    correct_answer = models.CharField(max_length=100)
    hint = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.unit} - {self.lesson} - {self.exercise_type} - {self.question} - {self.correct_answer}"

    def is_available(self):
        return self.lesson.is_complete

# import csv
# from quiz.models import QuizQuestion
#
# with open(r"C:\Users\louis\OneDrive\Bureau\content\exercises_to_be.csv", encoding="ISO-8859-1") as file:
#     reader = csv.DictReader(file, delimiter=";")
#     for row in reader:
#         QuizQuestion.objects.create(
#             unit_id=row["unit_id"],
#             lesson_title=row["lesson_title"],
#             exercise_type=row["exercise_type"],
#             question=row["question"],
#             correct_answer=row["correct_answer"],
#             hint=row["hint"]
#         )


