# backend/django_apps/authentication/serializers.py
from rest_framework import serializers
import logging

logger = logging.getLogger(__name__)
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import CoachProfile, Review, UserFeedback
from django.contrib.auth import get_user_model

User = get_user_model()
from django.contrib.auth.password_validation import validate_password
from decimal import Decimal
from django.core.validators import validate_email
from authentication.models import User


class UserSerializer(serializers.ModelSerializer):
    public_id = serializers.UUIDField(read_only=True, format='hex')
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    email = serializers.EmailField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)
    is_staff = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        # Expose only necessary fields for viewing
        fields = [
            'public_id', 'username', 'first_name', 'last_name', 'email', 'birthday', 'gender',
            'profile_picture', 'bio', 'native_language', 'target_language',
            'language_level', 'objectives', 'is_active', 'is_coach', 'is_subscribed',
            'is_superuser', 'is_staff', 'created_at', 'updated_at'
        ]
        # Mark sensitive fields as read-only
        read_only_fields = [
            'public_id', 'is_active', 'is_superuser', 'is_staff',
            'created_at', 'updated_at'
        ]

    def update(self, instance, validated_data):
        "To make an update to the user profile"
        for i in self.Meta.fields:
            if i not in self.Meta.read_only_fields and i in validated_data:
                setattr(instance, i, validated_data[i])
        instance.save()
        return instance

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            'username', 'first_name', 'last_name', 'email', 'birthday', 'gender',
            'profile_picture', 'bio', 'native_language', 'target_language',
            'language_level', 'objectives', 'password', 'password2'
        ]


    def validate(self, attrs):
        """
        Validate the password and target language fields.

        """
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Your passwords must be the same."})
        if attrs['native_language'] == attrs['target_language']:
            raise serializers.ValidationError({"target_language": "Your target language must be different from your native language."})
        return attrs

    def create(self, validated_data):
        """
        Create a new user instance.

        """
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            birthday=validated_data.get('birthday'),
            gender=validated_data.get('gender'),
            profile_picture=validated_data.get('profile_picture'),
            bio=validated_data.get('bio'),
            native_language=validated_data.get('native_language'),
            target_language=validated_data.get('target_language'),
            language_level=validated_data.get('language_level'),
            objectives=validated_data.get('objectives'),
        )
        return user


class MeSerializer(serializers.ModelSerializer):
    """
    Serializer for retrieving basic user profile information
    """
    # Custom fields or transformations can be added here
    birthday = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'public_id',  # UUID
            'username', 
            'email', 
            'first_name', 
            'last_name',
            'name',  # Full name
            'birthday',
            'gender',
            'native_language', 
            'target_language',
            'language_level',
            'objectives',
            'is_coach',
            'is_active',
            'is_subscribed',
            'profile_picture',
            'bio',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'public_id', 
            'email', 
            'is_active', 
            'is_coach',
            'is_subscribed', 
            'created_at', 
            'updated_at'
        ]

    def get_name(self, obj):
        """Generate full name"""
        return f"{obj.first_name} {obj.last_name}".strip()

    def get_age(self, obj):
        """Retrieve user's birthday"""
        return obj.birthday

# authentication/serializers.py
class ProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user profile
    """
    class Meta:
        model = User
        fields = [
            'first_name', 
            'last_name', 
            'username',
            'profile_picture', 
            'bio', 
            'birthday',
            'native_language', 
            'target_language', 
            'language_level', 
            'objectives',
            'gender'
        ]
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
            'username': {'required': False},
            'profile_picture': {'required': False, 'allow_null': True},
            'bio': {'required': False, 'allow_null': True, 'allow_blank': True},
            'native_language': {'required': False},
            'target_language': {'required': False},
            'language_level': {'required': False},
            'objectives': {'required': False},
            'gender': {'required': False, 'allow_null': True}
        }

    def validate(self, data):
        """
        Custom validation
        """
        logger.info(f"Validating profile update data: {data}")

        # Only validate languages if both are provided
        native_lang = data.get('native_language')
        target_lang = data.get('target_language')
        if native_lang and target_lang and native_lang == target_lang:
            raise serializers.ValidationError({
                'target_language': 'Target language must be different from native language'
            })

        return data

    def update(self, instance, validated_data):
        logger.info(f"Updating user profile with data: {validated_data}")
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance