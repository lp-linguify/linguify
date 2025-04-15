# backend/apps/course/apps.py
from django.apps import AppConfig

class CourseConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'course'
    verbose_name = "Courses"
    
    def ready(self):
        import course.signals 