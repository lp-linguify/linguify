# Generated by Django 5.1.2 on 2025-05-13 03:00

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('course', '0021_alter_lesson_options_alter_lesson_estimated_duration_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='matchingexercise',
            name='id',
            field=models.AutoField(primary_key=True, serialize=False),
        ),
        migrations.AlterField(
            model_name='vocabularylist',
            name='id',
            field=models.AutoField(primary_key=True, serialize=False),
        ),
    ]
