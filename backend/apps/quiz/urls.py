from django.urls import path
from .views import QuizAPIView

urlpatterns = [
    path('api/quiz/', QuizAPIView.as_view(), name='quiz-api'),
]
