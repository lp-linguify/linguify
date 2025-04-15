# backend/revision/serializers/flashcard_serializers.py
from rest_framework import serializers
from ..models import FlashcardDeck, Flashcard

class FlashcardSerializer(serializers.ModelSerializer):
    """Sérialiseur pour le modèle Flashcard."""
    
    # Ajout d'un champ calculé pour le temps écoulé depuis la dernière révision
    days_since_last_review = serializers.SerializerMethodField()
    # Ajout d'un champ calculé pour savoir si la carte est due pour révision
    is_due = serializers.SerializerMethodField()
    
    class Meta:
        model = Flashcard
        fields = [
            'id', 'deck', 'front_text', 'back_text', 'learned', 
            'created_at', 'updated_at', 'last_reviewed', 'review_count', 
            'next_review', 'days_since_last_review', 'is_due'
        ]
        read_only_fields = [
            'created_at', 'updated_at', 'last_reviewed', 
            'review_count', 'next_review', 'user',
            'days_since_last_review', 'is_due'
        ]
    
    def get_days_since_last_review(self, obj):
        """Calcule le nombre de jours depuis la dernière révision."""
        from django.utils import timezone
        if not obj.last_reviewed:
            return None
        
        delta = timezone.now() - obj.last_reviewed
        return delta.days
    
    def get_is_due(self, obj):
        """Détermine si la carte est due pour une révision."""
        from django.utils import timezone
        if not obj.next_review:
            return True  # Jamais révisée, donc due
        
        return obj.next_review <= timezone.now()
    
    def validate(self, data):
        """Validation personnalisée pour les cartes."""
        # Vérifier que les textes ne sont pas vides
        if 'front_text' in data and not data['front_text'].strip():
            raise serializers.ValidationError({"front_text": "Le texte recto ne peut pas être vide."})
        
        if 'back_text' in data and not data['back_text'].strip():
            raise serializers.ValidationError({"back_text": "Le texte verso ne peut pas être vide."})
        
        return data

class FlashcardDeckSerializer(serializers.ModelSerializer):
    """Sérialiseur pour le modèle FlashcardDeck."""
    
    # Ajout de champs calculés
    card_count = serializers.SerializerMethodField()
    learned_count = serializers.SerializerMethodField()
    username = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()
    days_until_deletion = serializers.SerializerMethodField()
    expiration_info = serializers.SerializerMethodField()
    
    class Meta:
        model = FlashcardDeck
        fields = [
            'id', 'name', 'description', 'created_at', 'updated_at', 
            'is_active', 'is_public', 'is_archived', 'expiration_date',
            'card_count', 'learned_count', 'username', 'is_owner',
            'days_until_deletion', 'expiration_info'
        ]
        read_only_fields = [
            'created_at', 'updated_at', 'user', 
            'card_count', 'learned_count', 'username', 'is_owner',
            'days_until_deletion', 'expiration_info'
        ]
    
    def get_card_count(self, obj):
        """Renvoie le nombre total de cartes dans ce deck."""
        return obj.flashcards.count()
    
    def get_learned_count(self, obj):
        """Renvoie le nombre de cartes apprises dans ce deck."""
        return obj.flashcards.filter(learned=True).count()
    
    def get_username(self, obj):
        """Renvoie le nom d'utilisateur du propriétaire du deck."""
        return obj.user.username if obj.user else None
    
    def get_is_owner(self, obj):
        """Détermine si l'utilisateur actuel est le propriétaire du deck."""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return obj.user == request.user
        return False
    
    def get_days_until_deletion(self, obj):
        """Renvoie le nombre de jours avant suppression automatique."""
        return obj.get_days_until_deletion()
    
    def get_expiration_info(self, obj):
        """Renvoie les informations détaillées sur l'expiration."""
        return obj.expiration_status
    
    def validate_name(self, value):
        """Valide que le nom du deck n'est pas vide et est unique pour l'utilisateur."""
        if not value.strip():
            raise serializers.ValidationError("Le nom du deck ne peut pas être vide.")
        
        # Vérifier l'unicité du nom pour cet utilisateur
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            # Pour les mises à jour, exclure l'instance actuelle
            instance = getattr(self, 'instance', None)
            queryset = FlashcardDeck.objects.filter(
                user=request.user, 
                name__iexact=value.strip()
            )
            
            if instance:
                queryset = queryset.exclude(pk=instance.pk)
                
            if queryset.exists():
                raise serializers.ValidationError(
                    "Vous avez déjà un deck avec ce nom. Veuillez choisir un nom différent."
                )
        
        return value.strip()

# Sérialiseur pour les opérations de création de deck avec un nombre minimal de champs
class FlashcardDeckCreateSerializer(serializers.ModelSerializer):
    is_public = serializers.BooleanField(default=False)
    
    class Meta:
        model = FlashcardDeck
        fields = ['id', 'name', 'description', 'is_active', 'is_public']
        read_only_fields = ['id']

# Sérialiseur pour afficher un deck avec ses cartes (utilisé pour les requêtes détaillées)
class FlashcardDeckDetailSerializer(FlashcardDeckSerializer):
    cards = FlashcardSerializer(source='flashcards', many=True, read_only=True)
    
    class Meta(FlashcardDeckSerializer.Meta):
        fields = FlashcardDeckSerializer.Meta.fields + ['cards']
        
# Sérialiseur pour l'archivage et la gestion des expiration
class DeckArchiveSerializer(serializers.Serializer):
    deck_id = serializers.IntegerField(required=True)
    action = serializers.ChoiceField(choices=['archive', 'unarchive', 'extend'], required=True)
    extension_days = serializers.IntegerField(required=False, min_value=1, max_value=365, default=30,
                                            help_text="Nombre de jours à ajouter à la date d'expiration")
    
    def validate(self, data):
        """Valide que le deck existe et appartient à l'utilisateur."""
        deck_id = data.get('deck_id')
        user = self.context.get('request').user
        
        try:
            deck = FlashcardDeck.objects.get(id=deck_id)
            
            # Vérifier que l'utilisateur est propriétaire du deck
            if deck.user != user:
                raise serializers.ValidationError(
                    {"deck_id": "Vous n'avez pas l'autorisation de modifier ce deck."}
                )
                
            # Stocker le deck pour l'utiliser dans la méthode save
            self.deck = deck
            
        except FlashcardDeck.DoesNotExist:
            raise serializers.ValidationError(
                {"deck_id": f"Le deck avec l'ID {deck_id} n'existe pas."}
            )
            
        return data
    
    def save(self):
        """
        Exécute l'action demandée sur le deck.
        
        Returns:
            dict: Résultat de l'opération
        """
        action = self.validated_data.get('action')
        deck = self.deck
        
        if action == 'archive':
            days_left = deck.archive()
            return {
                'success': True,
                'message': f"Le deck '{deck.name}' a été archivé.",
                'days_until_deletion': days_left,
                'deletion_date': deck.expiration_date
            }
            
        elif action == 'unarchive':
            deck.unarchive()
            return {
                'success': True,
                'message': f"Le deck '{deck.name}' a été retiré des archives."
            }
            
        elif action == 'extend':
            days = self.validated_data.get('extension_days', 30)
            result = FlashcardDeck.extend_expiration(deck.id, days=days)
            
            if result['success']:
                return {
                    'success': True,
                    'message': f"La date d'expiration du deck '{deck.name}' a été prolongée de {days} jours.",
                    'new_expiration_date': result['new_expiration'],
                    'days_until_deletion': result['days_until_deletion']
                }
            else:
                return {
                    'success': False,
                    'message': result['error']
                }
                
        return {
            'success': False,
            'message': f"Action '{action}' non reconnue."
        }