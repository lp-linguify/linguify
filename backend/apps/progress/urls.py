# backend/progress/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserLessonProgressViewSet,
    UserUnitProgressViewSet,
    ContentLessonProgressViewSet,
    UserProgressSummaryView
)
from .views import InitializeProgressView

app_name = 'progress'

router = DefaultRouter()
router.register(r'lessons', UserLessonProgressViewSet, basename='lesson-progress')
router.register(r'units', UserUnitProgressViewSet, basename='unit-progress')
router.register(r'content-lessons', ContentLessonProgressViewSet, basename='content-lesson-progress')

urlpatterns = [
    path('', include(router.urls)),
    path('summary/', UserProgressSummaryView.as_view(), name='progress-summary'),
    path('initialize/', InitializeProgressView.as_view(), name='initialize-progress'),
]