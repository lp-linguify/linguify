from rest_framework import serializers
from .models import Deck, Tag, Card, UserFlashcardProgress
from authentication.models import User

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']

class CardSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    deck_id = serializers.PrimaryKeyRelatedField(
        queryset=Deck.objects.all(),
        source='deck',
        write_only=True,
        required=True,
        help_text="ID du deck auquel cette carte est rattachée."
    )
    class Meta:
        model = Card
        fields = ['id', 'front_text', 'back_text', 'image', 'tags', 'deck_id', 'date_created', 'last_updated']

class DeckSerializer(serializers.ModelSerializer):
    cards = CardSerializer(many=True, read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='user',
        write_only=True,
        required=True,
        help_text=("ID of the deck owner.")
    )

    class Meta:
        model = Deck
        fields = ['id', 'title', 'description', 'language', 'date_created', 'cards', 'user_id']

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get('request')
        if request and not request.user.is_staff:
            # If only staff can set user ownership, you might restrict here.
            fields['user_id'].queryset = User.objects.filter(pk=request.user.pk)
        return fields


class UserFlashcardProgressSerializer(serializers.ModelSerializer):
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=UserFlashcardProgress.objects.none(),
        source='user',
        write_only=True,
        required=True,
        help_text="ID de l'utilisateur"
    )
    card_id = serializers.PrimaryKeyRelatedField(
        queryset=Card.objects.all(),
        source='card',
        write_only=True,
        required=True,
        help_text="ID de la carte"
    )

    class Meta:
        model = UserFlashcardProgress
        fields = [
            'id', 'status', 'percentage_completion', 'score', 'time_studied', 'last_reviewed',
            'due_date', 'interval_days', 'easiness_factor', 'review_count', 'user_id', 'card_id'
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Idem pour user, possibilité d'ajuster dynamiquement.
        self.fields['user_id'].queryset = self.context.get('request').user.__class__.objects.all()

class ExcelUploadSerializer(serializers.Serializer):
    file = serializers.FileField(help_text="Excel file (.xlsx) containing data to upload.")
