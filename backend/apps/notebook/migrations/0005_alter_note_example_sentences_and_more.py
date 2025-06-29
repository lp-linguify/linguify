# Generated by Django 5.1.2 on 2025-06-18 03:49

import apps.notebook.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notebook', '0004_note_notebook_no_user_id_843600_idx_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='note',
            name='example_sentences',
            field=models.JSONField(blank=True, default=apps.notebook.models.default_list),
        ),
        migrations.AlterField(
            model_name='note',
            name='last_reviewed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='note',
            name='related_words',
            field=models.JSONField(blank=True, default=apps.notebook.models.default_list),
        ),
    ]
