#
#
# from django import forms
# from .models
#
#
#
# class ThemeForm(forms.Form):
#     """
#     A form to select a theme from a list of choices extracted from Vocabulary model.
#     """
#     def __init__(self, *args, **kwargs):
#         super(ThemeForm, self).__init__(*args, **kwargs)
#         self.fields['theme'].choices = self.get_theme_choices()
#
#     theme = forms.ChoiceField(label='Sélectionnez un thème')
#
#     def get_theme_choices(self):
#         """
#         Retrieves a list of theme choices from the Vocabulary model.
#         """
#         theme_choices = Revision.objects.values_list('theme', flat=True).distinct()
#         return [(theme, theme) for theme in theme_choices]
#
#
#
