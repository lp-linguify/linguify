# revision/forms.py

import csv
from django import forms
from django.core.exceptions import ValidationError
from platforme.models import Vocabulaire, Activity
from .models import Revision


class ImportForm(forms.Form):
    file = forms.FileField(label='Sélectionner un fichier CSV')

    def clean_file(self):
        file = self.cleaned_data['file']
        if not file.name.endswith('.csv'):
            raise ValidationError('Le fichier doit être un fichier CSV.')
        return file


class RevisionForm(forms.ModelForm):
    class Meta:
        model = Revision
        fields = ['vocabulaire', 'activity']

# revision/templates/revision/add_revision.html et revision/templates/revision/edit_revision.html
# Assurez-vous que vos templates HTML utilisent correctement les champs du formulaire `RevisionForm'.
