# backend/progress/models/__init__.py
from .progress_base import BaseProgress, STATUS_CHOICES
from .progress_course import (
    UserCourseProgress, 
    UserLessonProgress, 
    UserUnitProgress
)

__all__ = [
    'BaseProgress',
    'STATUS_CHOICES',
    'UserCourseProgress',
    'UserLessonProgress',
    'UserUnitProgress'
]