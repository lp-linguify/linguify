from django.contrib import admin
from .models import Note, SharedNote


admin.site.register(Note)
admin.site.register(SharedNote)