# -*- coding: utf-8 -*-
# Part of Linguify. See LICENSE file for full copyright and licensing details.

from django import forms
from django.contrib.admin.widgets import AdminTextareaWidget
from django.utils.safestring import mark_safe
from .models import FillBlankExercise

class JSONMultilingualWidget(AdminTextareaWidget):
    """
    Custom widget to edit multilingual JSON fields
    with buttons to quickly add different languages.
    """
    template_name = 'admin/widgets/json_multilingual_widget.html'

    def get_context(self, name, value, attrs):
        context = super().get_context(name, value, attrs)
        context['widget']['type'] = 'json-multilingual'
        context['available_languages'] = self.get_available_languages()
        context['field_name'] = name
        return context

    def get_available_languages(self):
        """List of available languages with their full names."""
        return [
            {'code': 'en', 'name': 'English'},
            {'code': 'fr', 'name': 'French'},
            {'code': 'es', 'name': 'Spanish'},
            {'code': 'nl', 'name': 'Dutch'},
            {'code': 'de', 'name': 'German'},
            {'code': 'it', 'name': 'Italian'},
            {'code': 'pt', 'name': 'Portuguese'},
            # Add more languages as needed
        ]

class AdminJSONFormField(forms.JSONField):
    """Custom JSON form field for the admin site."""
    
    def __init__(self, **kwargs):
        if 'widget' not in kwargs:
            kwargs['widget'] = JSONMultilingualWidget(attrs={'rows': 5, 'class': 'json-editor'})
        super().__init__(**kwargs)


# Add to admin.py after the FillBlankExerciseAdmin class

# Remplacer le formulaire standard par un formulaire personnalisé
from django import forms
from .widgets import AdminJSONFormField

class FillBlankExerciseAdminForm(forms.ModelForm):
    """Formulaire personnalisé pour l'admin des exercices à trous"""
    
    instructions = AdminJSONFormField(
        label="Instructions",
        help_text="Instructions dans différentes langues"
    )
    
    sentences = AdminJSONFormField(
        label="Phrases avec trous",
        help_text="Phrases avec ___ pour indiquer l'emplacement du trou"
    )
    
    answer_options = AdminJSONFormField(
        label="Options de réponse",
        help_text="Tableau d'options pour chaque langue"
    )
    
    correct_answers = AdminJSONFormField(
        label="Réponses correctes",
        help_text="Réponse correcte pour chaque langue"
    )
    
    hints = AdminJSONFormField(
        label="Indices",
        help_text="Indices optionnels pour chaque langue",
        required=False
    )
    
    explanations = AdminJSONFormField(
        label="Explications",
        help_text="Explications des réponses pour chaque langue",
        required=False
    )
    
    tags = AdminJSONFormField(
        label="Tags",
        help_text="Tags pour catégoriser l'exercice",
        required=False
    )
    
    class Meta:
        model = FillBlankExercise
        fields = '__all__'