# backend/revision/serializers/add_vocabulary_serializers.py

from rest_framework import serializers
from ..models.add_vocabulary import CreateRevisionList, AddField

class CreateRevisionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreateRevisionList
        fields = ['id', 'title', 'description', 'created_at']
        read_only_fields = ['created_at']

class AddFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = AddField
        fields = ['id', 'field_1', 'field_2', 'created_at', 'last_reviewed']
        read_only_fields = ['created_at', 'last_reviewed']