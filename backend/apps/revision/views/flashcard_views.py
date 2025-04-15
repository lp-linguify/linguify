# backend/revision/views/flashcard_views.py
from django.utils import timezone
from django.db.models import Q, Count
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
import pandas as pd
from rest_framework import filters
from django.shortcuts import get_object_or_404
from revision.models import FlashcardDeck, Flashcard
from revision.serializers import (
    FlashcardDeckSerializer, 
    FlashcardSerializer,
    FlashcardDeckDetailSerializer,
    FlashcardDeckCreateSerializer,
    DeckArchiveSerializer
)

import logging
logger = logging.getLogger(__name__)

class FlashcardDeckViewSet(viewsets.ModelViewSet):
    serializer_class = FlashcardDeckSerializer
    permission_classes = [AllowAny]  # Autoriser l'accès public à la liste des decks
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'user__username']  # Ajout de la recherche par utilisateur
    ordering_fields = ['created_at', 'name', 'user__username']
    ordering = ['-created_at']

    def get_serializer_class(self):
        """Sélectionne le sérialiseur approprié selon l'action."""
        if self.action == 'create':
            return FlashcardDeckCreateSerializer
        elif self.action == 'retrieve':
            return FlashcardDeckDetailSerializer
        elif self.action == 'archive_management':
            return DeckArchiveSerializer
        return FlashcardDeckSerializer

    def get_permissions(self):
        """
        Gestion dynamique des permissions:
        - Lecture publique pour les decks publics
        - Authentication requise pour modifier
        """
        if self.action in ['update', 'partial_update', 'destroy', 'create', 
                          'toggle_public', 'archive_management', 'batch_delete']:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()


    def get_queryset(self):
        """
        Retourne les decks appropriés selon le contexte:
        - Utilisateur authentifié: par défaut uniquement ses decks, peut voir les publics sur demande
        - Utilisateur anonyme: uniquement les decks publics
        """
        user = self.request.user
        
        # Paramètres de requête avec valeurs par défaut modifiées
        show_public = self.request.query_params.get('public', 'false').lower() == 'true'  # Changé à false par défaut
        show_mine = self.request.query_params.get('mine', 'true').lower() == 'true' and user.is_authenticated
        show_archived = self.request.query_params.get('archived', 'false').lower() == 'true'
        username_filter = self.request.query_params.get('username')
        
        # Construction du filtre de base
        filter_query = Q(is_active=True)
        
        # Commencer avec une requête vide
        queryset = FlashcardDeck.objects.none()
        
        if user.is_authenticated and show_mine:
            # Ajouter les decks de l'utilisateur courant
            owner_filter = Q(user=user)
            
            # Filtrage par statut d'archivage pour les decks de l'utilisateur
            if not show_archived:
                owner_filter &= Q(is_archived=False)
            
            # Obtenir les decks de l'utilisateur
            user_decks = FlashcardDeck.objects.filter(owner_filter)
            queryset = user_decks
        
        if show_public:
            # Ajouter les decks publics (non archivés) des autres utilisateurs
            public_filter = Q(is_public=True, is_archived=False)
            if user.is_authenticated:
                # Exclure les decks de l'utilisateur courant des decks publics
                public_filter &= ~Q(user=user)
                
            public_decks = FlashcardDeck.objects.filter(public_filter)
            queryset = queryset.union(public_decks)
        
        if username_filter:
            # Filtrer par nom d'utilisateur spécifique (seulement les decks publics et non archivés)
            queryset = queryset.filter(user__username=username_filter)
        
        return queryset.distinct()

    def perform_create(self, serializer):
        """Associe automatiquement l'utilisateur actuel lors de la création d'un deck."""
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            raise PermissionError("Authentication required to create a deck")

    def update(self, request, *args, **kwargs):
        """
        Surcharge de la méthode update pour vérifier que l'utilisateur
        ne modifie que ses propres decks
        """
        instance = self.get_object()
        if instance.user != request.user:
            return Response(
                {"detail": "You don't have permission to modify this deck"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Vérifier si le deck est archivé
        if instance.is_archived:
            return Response(
                {"detail": "This deck is archived. Please unarchive it first to make changes."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """
        Surcharge de la méthode de suppression pour vérifier que l'utilisateur
        ne supprime que ses propres decks
        """
        instance = self.get_object()
        if instance.user != request.user:
            return Response(
                {"detail": "You don't have permission to delete this deck"},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def toggle_public(self, request, pk=None):
        """Action pour basculer la visibilité publique d'un deck."""
        deck = self.get_object()
        
        # Vérifier que l'utilisateur est propriétaire du deck
        if deck.user != request.user:
            return Response(
                {"detail": "You don't have permission to modify this deck's visibility"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Ne pas permettre de rendre public un deck archivé
        if deck.is_archived and not deck.is_public and request.data.get('make_public', True):
            return Response(
                {"detail": "You cannot make an archived deck public. Please unarchive it first."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Basculer le statut public
        make_public = request.data.get('make_public')
        if make_public is not None:
            deck.is_public = make_public
        else:
            deck.is_public = not deck.is_public
            
        deck.save()
        
        return Response({
            "is_public": deck.is_public,
            "message": f"Deck visibility set to {'public' if deck.is_public else 'private'}"
        })

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def archive_management(self, request):
        """
        Endpoint pour gérer l'archivage et la prolongation des decks.
        Permet d'archiver, désarchiver ou prolonger la date d'expiration.
        """
        serializer = DeckArchiveSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            result = serializer.save()
            return Response(result)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def clone(self, request, pk=None):
        """
        Action pour cloner un deck public d'un autre utilisateur.
        Crée une copie du deck et de ses cartes pour l'utilisateur courant.
        """
        source_deck = self.get_object()
        
        # Vérifier que le deck est public ou appartient à l'utilisateur
        if not source_deck.is_public and source_deck.user != request.user:
            return Response(
                {"detail": "You can only clone public decks or your own decks"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Ne pas permettre de cloner un deck archivé, sauf s'il appartient à l'utilisateur
        if source_deck.is_archived and source_deck.user != request.user:
            return Response(
                {"detail": "You cannot clone an archived deck from another user"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Créer un nouveau deck pour l'utilisateur
            new_deck = FlashcardDeck.objects.create(
                user=request.user,
                name=request.data.get('name', f"Clone of {source_deck.name}"),
                description=request.data.get('description', 
                                            f"Cloned from {source_deck.user.username}'s deck: {source_deck.description}"),
                is_active=True,
                is_public=False,  # Par défaut, les clones sont privés
                is_archived=False # Les clones ne sont jamais archivés
            )
            
            # Copier toutes les cartes
            cards_created = 0
            for card in source_deck.flashcards.all():
                Flashcard.objects.create(
                    user=request.user,
                    deck=new_deck,
                    front_text=card.front_text,
                    back_text=card.back_text,
                    learned=False,  # Réinitialiser l'état d'apprentissage
                    review_count=0  # Réinitialiser les stats d'apprentissage
                )
                cards_created += 1
            
            # Retourner les informations sur le nouveau deck
            serializer = FlashcardDeckSerializer(new_deck, context={'request': request})
            
            return Response({
                "message": f"Successfully cloned '{source_deck.name}' with {cards_created} cards",
                "deck": serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error cloning deck {pk}: {str(e)}")
            return Response(
                {"detail": f"Failed to clone deck: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['get'])
    def cards(self, request, pk=None):
        """Récupérer toutes les cartes d'un deck spécifique."""
        try:
            deck = self.get_object()
            
            # Vérifier l'accès aux cartes
            if not deck.is_public and (not request.user.is_authenticated or deck.user != request.user):
                return Response(
                    {"detail": "You don't have permission to view cards in this deck"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Ne pas permettre de voir les cartes d'un deck archivé sauf au propriétaire
            if deck.is_archived and (not request.user.is_authenticated or deck.user != request.user):
                return Response(
                    {"detail": "This deck is archived and not available for viewing"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            cards_query = deck.flashcards.all()
            
            # Filtres optionnels
            learned = request.query_params.get('learned')
            if learned is not None:
                is_learned = learned.lower() == 'true'
                cards_query = cards_query.filter(learned=is_learned)
                
            # Trier par date de création décroissante
            cards = cards_query.order_by('-created_at')
            
            serializer = FlashcardSerializer(cards, many=True, context={'request': request})
            return Response(serializer.data)
        
        except Exception as e:
            logger.error(f"Error fetching cards for deck {pk}: {str(e)}")
            return Response(
                {"detail": f"Failed to fetch cards: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def popular(self, request):
        """
        Endpoint dédié pour récupérer les decks publics populaires.
        Les decks sont triés par nombre de cartes ou de clones.
        """
        # Filtrer uniquement les decks publics et non archivés
        queryset = FlashcardDeck.objects.filter(is_public=True, is_active=True, is_archived=False)
        
        # Annoter avec le nombre de cartes pour trier par popularité
        queryset = queryset.annotate(card_count=Count('flashcards')).order_by('-card_count')
        
        # Limiter le nombre de résultats
        limit = int(request.query_params.get('limit', 10))
        queryset = queryset[:limit]
        
        # Pagination optionnelle
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def archived(self, request):
        """Récupère tous les decks archivés de l'utilisateur courant."""
        queryset = FlashcardDeck.objects.filter(
            user=request.user, 
            is_archived=True
        ).order_by('expiration_date')
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def expiring_soon(self, request):
        """Récupère les decks qui vont expirer bientôt."""
        # Utiliser la méthode de classe pour trouver les decks à avertir
        queryset = FlashcardDeck.get_decks_needing_warning(user=request.user)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "count": queryset.count(),
            "decks": serializer.data
        })
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def cleanup_expired(self, request):
        """Action pour nettoyer les decks expirés (admin uniquement)."""
        # Vérifier que l'utilisateur est superutilisateur
        if not request.user.is_superuser:
            return Response(
                {"detail": "Only administrators can perform this action"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Exécuter le nettoyage
        count = FlashcardDeck.cleanup_expired()
        
        return Response({
            "message": f"Cleanup completed: {count} expired decks deleted",
            "count": count
        })
        
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def batch_delete(self, request):
        """Supprimer plusieurs decks en une seule requête."""
        try:
            deck_ids = request.data.get('deckIds', [])
            
            if not deck_ids:
                return Response(
                    {"detail": "No deck IDs provided"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Vérifier que l'utilisateur est autorisé à supprimer ces decks
            queryset = FlashcardDeck.objects.filter(
                id__in=deck_ids,
                user=request.user  # S'assurer que les decks appartiennent à l'utilisateur
            )
            
            # Compter le nombre de decks trouvés (qui appartiennent à l'utilisateur)
            count = queryset.count()
            
            if count == 0:
                return Response(
                    {"detail": "No accessible decks found with these IDs"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Supprimer les decks
            deleted_count, _ = queryset.delete()
            
            return Response({
                "message": f"Successfully deleted {deleted_count} decks",
                "deleted": deleted_count
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error batch deleting decks: {str(e)}")
            return Response(
                {"detail": f"Failed to delete decks: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

class FlashcardViewSet(viewsets.ModelViewSet):
    serializer_class = FlashcardSerializer
    permission_classes = [AllowAny]  # Permission de base
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['front_text', 'back_text']
    ordering_fields = ['created_at', 'last_reviewed', 'review_count']
    ordering = ['-created_at']

    def get_permissions(self):
        """
        Gestion dynamique des permissions:
        - Lecture publique pour les cartes des decks publics
        - Authentication requise pour modifier
        """
        if self.action in ['update', 'partial_update', 'destroy', 'create', 'toggle_learned', 'batch_delete']:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

    def get_queryset(self):
        """
        Filtrer les cartes selon le contexte:
        - Si authentifié: ses cartes + cartes des decks publics
        - Si non authentifié: uniquement cartes des decks publics
        """
        user = self.request.user
        
        if user.is_authenticated:
            # Utilisateur authentifié - voir ses cartes et celles des decks publics
            queryset = Flashcard.objects.filter(
                Q(user=user) | Q(deck__is_public=True, deck__is_archived=False)
            )
        else:
            # Utilisateur anonyme - voir uniquement les cartes des decks publics et non archivés
            queryset = Flashcard.objects.filter(
                deck__is_public=True,
                deck__is_archived=False
            )
        
        # Filtrer par deck si demandé
        deck_id = self.request.query_params.get('deck')
        if deck_id:
            queryset = queryset.filter(deck_id=deck_id)
        
        # Filtrer par statut learned si demandé
        learned = self.request.query_params.get('learned')
        if learned is not None:
            is_learned = learned.lower() == 'true'
            queryset = queryset.filter(learned=is_learned)
            
        return queryset

    def create(self, request, *args, **kwargs):
        """Créer une nouvelle carte dans un deck spécifique."""
        deck_id = request.data.get('deck')
        
        try:
            # Vérifier que l'utilisateur a les droits sur le deck
            deck = get_object_or_404(FlashcardDeck, id=deck_id)
            
            if deck.user != request.user:
                return Response(
                    {"detail": "You don't have permission to add cards to this deck"},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            # Vérifier que le deck n'est pas archivé
            if deck.is_archived:
                return Response(
                    {"detail": "You cannot add cards to an archived deck. Please unarchive it first."},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Créer la carte
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(user=request.user, deck=deck)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creating flashcard: {str(e)}")
            return Response(
                {"detail": f"Failed to create flashcard: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    def update(self, request, *args, **kwargs):
        """Vérifier les droits de modification."""
        instance = self.get_object()
        
        # Vérifier si l'utilisateur est propriétaire
        if instance.user != request.user:
            return Response(
                {"detail": "You don't have permission to modify this card"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Vérifier si le deck est archivé
        if instance.deck.is_archived:
            return Response(
                {"detail": "You cannot modify cards in an archived deck. Please unarchive the deck first."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Vérifier les droits de suppression."""
        instance = self.get_object()
        
        # Vérifier si l'utilisateur est propriétaire
        if instance.user != request.user:
            return Response(
                {"detail": "You don't have permission to delete this card"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Vérifier si le deck est archivé
        if instance.deck.is_archived:
            return Response(
                {"detail": "You cannot delete cards from an archived deck. Please unarchive the deck first."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def toggle_learned(self, request, pk=None):
        """Basculer l'état d'apprentissage et mettre à jour les statistiques."""
        try:
            card = self.get_object()
            
            # Vérifier que l'utilisateur est propriétaire de la carte
            if card.user != request.user:
                return Response(
                    {"detail": "You don't have permission to update this card's status"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Vérifier si le deck est archivé
            if card.deck.is_archived:
                return Response(
                    {"detail": "You cannot update cards in an archived deck. Please unarchive the deck first."},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            success = request.data.get('success', True)
            
            # Utiliser la méthode mark_reviewed du modèle
            card.mark_reviewed(success=success)
            
            serializer = self.get_serializer(card)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error toggling card {pk} learned status: {str(e)}")
            return Response(
                {"detail": f"Failed to update card: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def due_for_review(self, request):
        """Récupérer les cartes à réviser pour l'utilisateur actuel."""
        try:
            # Cette action nécessite l'authentification
            if not request.user.is_authenticated:
                return Response(
                    {"detail": "Authentication required to view cards due for review"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
                
            limit = int(request.query_params.get('limit', 10))
            deck_id = request.query_params.get('deck', None)
            
            # Construction de la requête - filtrer par utilisateur
            query = Q(user=request.user) & (Q(next_review__lte=timezone.now()) | Q(next_review__isnull=True))
            
            # Exclure les cartes des decks archivés
            query &= Q(deck__is_archived=False)
            
            if deck_id:
                # Vérifier que le deck appartient à l'utilisateur et n'est pas archivé
                deck = get_object_or_404(FlashcardDeck, id=deck_id, user=request.user, is_archived=False)
                query &= Q(deck=deck)
            
            cards = Flashcard.objects.filter(query).order_by('last_reviewed')[:limit]
            
            serializer = self.get_serializer(cards, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error fetching due cards: {str(e)}")
            return Response(
                {"detail": f"Failed to fetch due cards: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def ids(self, request):
        """Récupérer uniquement les IDs des flashcards, optionnellement filtrées par deck."""
        try:
            deck_id = request.query_params.get('deck')
            
            # Appliquer les filtres
            queryset = self.get_queryset()
            if deck_id:
                queryset = queryset.filter(deck_id=deck_id)
            
            # Récupérer seulement les IDs pour optimiser les performances
            card_ids = queryset.values_list('id', flat=True)
            
            return Response(list(card_ids))
            
        except Exception as e:
            logger.error(f"Error fetching card IDs: {str(e)}")
            return Response(
                {"detail": f"Failed to fetch card IDs: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def batch_delete(self, request):
        """Supprimer plusieurs flashcards en une seule requête."""
        try:
            card_ids = request.data.get('cardIds', [])
            
            if not card_ids:
                return Response(
                    {"detail": "No card IDs provided"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Vérifier que l'utilisateur est autorisé à supprimer ces cartes
            queryset = self.get_queryset().filter(
                id__in=card_ids,
                user=request.user,  # S'assurer que les cartes appartiennent à l'utilisateur
                deck__is_archived=False  # Ne pas permettre la suppression dans les decks archivés
            )
            
            # Stocker le nombre de cartes trouvées
            count = queryset.count()
            
            if count == 0:
                return Response(
                    {"detail": "No accessible cards found with these IDs or cards are in archived decks"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Supprimer les cartes
            deleted_count, _ = queryset.delete()
            
            return Response({
                "message": f"Successfully deleted {deleted_count} cards",
                "deleted": deleted_count
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error batch deleting cards: {str(e)}")
            return Response(
                {"detail": f"Failed to delete cards: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

class FlashcardImportView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, deck_id=None):
        try:
            # Récupérer le fichier Excel et l'ID du deck
            excel_file = request.FILES.get('file')
            has_header = request.data.get('has_header', 'true').lower() == 'true'
            
            # Vérifier si le fichier est présent
            if not excel_file:
                return Response({"detail": "Aucun fichier n'a été fourni."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Vérifier le type de fichier (.xls | .xlsx | .csv)
            if not (excel_file.name.endswith('.xls') or excel_file.name.endswith('.xlsx') or excel_file.name.endswith('.csv')):
                return Response({"detail": "Le fichier doit être au format Excel (.xls, .xlsx) ou CSV."},
                               status=status.HTTP_400_BAD_REQUEST)

            # Vérifier si le deck existe et appartient à l'utilisateur
            try:
                deck = FlashcardDeck.objects.get(id=deck_id, user=request.user)
            except FlashcardDeck.DoesNotExist:
                return Response({"detail": "Le deck spécifié n'existe pas ou ne vous appartient pas."}, 
                               status=status.HTTP_404_NOT_FOUND)
            
            # to read the file taking into account the file type and the presence of a header
            if excel_file.name.endswith('.csv'):
                df = pd.read_csv(excel_file, header=0 if has_header else None)
            else:
                df=pd.read_excel(excel_file, engine='openpyxl', header=0 if has_header else None)

            if not has_header:
                df.columns = ['front_text', 'back_text'] + [f'col_{i}' for i in range(2, len(df.columns))]
            
            preview_data = df.head(5).to_dict(orient='records')
            if request.data.get('preview_only', 'false').lower() == 'true':
                return Response({
                    "preview": preview_data,
                    "total_rows": len(df),
                    "columns": list(df.columns),
                }, status=status.HTTP_200_OK)
            
            # Vérifier que les colonnes nécessaires existent
            required_columns = ['front_text', 'back_text']
            # Si le fichier a des noms de colonnes différents (par exemple 'anglais', 'français'),
            # on peut les mapper automatiquement aux 2 premières colonnes
            if len(df.columns) < 2:
                return Response({"detail": "Le fichier doit contenir au moins 2 colonnes."}, 
                               status=status.HTTP_400_BAD_REQUEST)
            
            # Si les colonnes ne sont pas nommées front_text et back_text, on les renomme
            if df.columns[0] != 'front_text' or df.columns[1] != 'back_text':
                df = df.iloc[:, :2]  # Prendre seulement les 2 premières colonnes
                df.columns = ['front_text', 'back_text']
            
            # Créer les flashcards
            flashcards_created = 0
            flashcards_failed = 0
            
            for _, row in df.iterrows():
                front_text = str(row['front_text']).strip()
                back_text = str(row['back_text']).strip()
                
                # Ignorer les lignes vides
                if not front_text or not back_text or front_text == 'nan' or back_text == 'nan':
                    continue
                
                try:
                    Flashcard.objects.create(
                        deck=deck,
                        front_text=front_text,
                        back_text=back_text,
                        user=request.user
                    )
                    flashcards_created += 1
                except Exception as e:
                    flashcards_failed += 1
                    print(f"Erreur lors de la création d'une flashcard: {e}")
            
            return Response({
                "detail": f"{flashcards_created} cartes ont été importées avec succès. {flashcards_failed} imports ont échoué.",
                "created": flashcards_created,
                "failed": flashcards_failed,
                "preview": preview_data[:3]  # Renvoyer quelques exemples des données importées
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({"detail": f"Une erreur s'est produite lors de l'importation: {str(e)}"}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class PublicDecksViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet spécifique pour explorer les decks publics.
    En lecture seule, ne permet pas de modification.
    """
    serializer_class = FlashcardDeckSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'user__username']
    ordering_fields = ['created_at', 'name', 'user__username']
    ordering = ['-created_at']

    def get_queryset(self):
        """Ne retourne que les decks publics actifs et non archivés."""
        queryset = FlashcardDeck.objects.filter(
            is_public=True,
            is_active=True,
            is_archived=False
        )
        
        # Filtres supplémentaires
        language = self.request.query_params.get('language')
        username = self.request.query_params.get('username')
        
        # Filtrer par langue si spécifié
        # Note: Cela suppose que vous avez un champ "language" sur votre modèle FlashcardDeck
        # Si ce n'est pas le cas, vous pouvez l'ignorer ou l'adapter à vos besoins
        if language:
            queryset = queryset.filter(language=language)
            
        # Filtrer par nom d'utilisateur si spécifié
        if username:
            queryset = queryset.filter(user__username=username)
            
        # Tri par popularité si demandé
        sort_by = self.request.query_params.get('sort_by')
        if sort_by == 'popularity':
            # Annoter avec le nombre de cartes
            queryset = queryset.annotate(card_count=Count('flashcards')).order_by('-card_count')
            
        return queryset
        
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def clone(self, request, pk=None):
        """
        Action pour cloner un deck public.
        Crée une copie du deck et de ses cartes pour l'utilisateur courant.
        """
        source_deck = self.get_object()
        
        # Si nous sommes dans ce viewset, le deck est forcément public, mais vérifions quand même
        if not source_deck.is_public:
            return Response(
                {"detail": "You can only clone public decks"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Créer un nouveau deck pour l'utilisateur
            new_deck = FlashcardDeck.objects.create(
                user=request.user,
                name=request.data.get('name', f"Clone of {source_deck.name}"),
                description=request.data.get('description', 
                                          f"Cloned from {source_deck.user.username}'s deck: {source_deck.description}"),
                is_active=True,
                is_public=False,  # Par défaut, les clones sont privés
                is_archived=False
            )
            
            # Copier toutes les cartes
            cards_created = 0
            for card in source_deck.flashcards.all():
                Flashcard.objects.create(
                    user=request.user,
                    deck=new_deck,
                    front_text=card.front_text,
                    back_text=card.back_text,
                    learned=False,
                    review_count=0
                )
                cards_created += 1
            
            # Retourner les informations sur le nouveau deck
            serializer = FlashcardDeckSerializer(new_deck, context={'request': request})
            
            return Response({
                "message": f"Successfully cloned '{source_deck.name}' with {cards_created} cards",
                "deck": serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error cloning public deck {pk}: {str(e)}")
            return Response(
                {"detail": f"Failed to clone deck: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """
        Liste les decks publics les plus populaires.
        Définit la popularité en fonction du nombre de cartes dans le deck.
        """
        queryset = self.get_queryset().annotate(
            card_count=Count('flashcards')
        ).order_by('-card_count')
        
        # Limiter le nombre de résultats
        limit = int(request.query_params.get('limit', 10))
        queryset = queryset[:limit]
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
        
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Liste les decks publics les plus récents."""
        queryset = self.get_queryset().order_by('-created_at')
        
        # Limiter le nombre de résultats
        limit = int(request.query_params.get('limit', 10))
        queryset = queryset[:limit]
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)