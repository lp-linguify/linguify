# course/filters.py

import django_filters as filters
from .models import Lesson, VocabularyList

class LessonFilter(filters.FilterSet):
    lesson_type = filters.CharFilter(field_name='lesson_type', lookup_expr='icontains')
    is_complete = filters.BooleanFilter(field_name='is_completed')
    min_order = filters.NumberFilter(field_name='order', lookup_expr='gte')
    max_order = filters.NumberFilter(field_name='order', lookup_expr='lte')

    class Meta:
        model = Lesson
        fields = ['lesson_type', 'is_complete', 'min_order', 'max_order']

class VocabularyListFilter(filters.FilterSet):
    lesson = filters.CharFilter(field_name='lesson__title', lookup_expr='icontains')

    class Meta:
        model = VocabularyList
        fields = ['lesson']



