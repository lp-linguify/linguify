# backend/chat/serializers.py
from rest_framework import serializers
from .models import Conversation, ConversationMessage
from authentication.serializers import UserSerializer

class ConversationListSerializer(serializers.ModelSerializer):
    users = UserSerializer(many=True, read_only=True)
    class Meta:
        model = Conversation
        fields = ('id', 'users', 'updated_at')


class ConversationDetailSerializer(serializers.ModelSerializer):
    users = UserSerializer(many=True, read_only=True)
    class Meta:
        model = Conversation
        fields = ('id', 'users', 'updated_at')

class ConversationMessageSerializer(serializers.ModelSerializer):
    users = UserSerializer(many=True, read_only=True)
    created_at = UserSerializer(many=True, read_only=True)
    class Meta:
        model = ConversationMessage
        fields = ('id', 'body', 'sent_to', 'created_at')

