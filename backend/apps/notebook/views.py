from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.db.models import Q, Count, Prefetch
from django.utils import timezone
from django.core.cache import cache
from django.db import transaction
from django_filters.rest_framework import DjangoFilterBackend
from datetime import timedelta

from .models import Note, NoteCategory, Tag, SharedNote
from .serializers import (
    NoteSerializer, NoteCategorySerializer, TagSerializer,
    SharedNoteSerializer, NoteDetailSerializer, NoteListSerializer
)

class TagViewSet(viewsets.ModelViewSet):
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']
    
    def get_queryset(self):
        return Tag.objects.filter(user=self.request.user).annotate(
            notes_count=Count('note')
        )

    @action(detail=True, methods=['post'])
    def merge(self, request, pk=None):
        """Fusionner ce tag avec un autre"""
        target_tag_id = request.data.get('target_tag_id')
        if not target_tag_id:
            raise ValidationError({"target_tag_id": "This field is required."})

        source_tag = self.get_object()
        try:
            target_tag = Tag.objects.get(
                id=target_tag_id,
                user=request.user
            )
        except Tag.DoesNotExist:
            raise ValidationError({"target_tag_id": "Invalid tag ID."})

        with transaction.atomic():
            # Déplacer toutes les notes du tag source vers le tag cible
            source_tag.note_set.update(tags=target_tag)
            source_tag.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

class NoteCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = NoteCategorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']
    
    def get_queryset(self):
        queryset = NoteCategory.objects.filter(user=self.request.user)
        if self.action == 'list':
            # Pour la liste principale, ne retourner que les catégories racines
            queryset = queryset.filter(parent=None)
        return queryset.prefetch_related(
            Prefetch(
                'note_set',
                queryset=Note.objects.order_by('-created_at')[:5]
            )
        )

    @action(detail=True)
    def tree(self, request, pk=None):
        """Retourner l'arborescence complète à partir de cette catégorie"""
        category = self.get_object()
        serializer = self.get_serializer(category)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def move(self, request, pk=None):
        """Déplacer une catégorie vers un nouveau parent"""
        new_parent_id = request.data.get('parent_id')
        category = self.get_object()

        if new_parent_id:
            try:
                new_parent = NoteCategory.objects.get(
                    id=new_parent_id,
                    user=request.user
                )
                if new_parent == category or new_parent.parent == category:
                    raise ValidationError(
                        {"parent_id": "Invalid parent category."}
                    )
                category.parent = new_parent
            except NoteCategory.DoesNotExist:
                raise ValidationError({"parent_id": "Invalid parent ID."})
        else:
            category.parent = None
        
        category.save()
        serializer = self.get_serializer(category)
        return Response(serializer.data)

class NoteViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'category': ['exact', 'isnull'],
        'note_type': ['exact', 'in'],
        'priority': ['exact', 'in'],
        'is_pinned': ['exact'],
        'is_archived': ['exact'],
        'created_at': ['gte', 'lte'],
        'updated_at': ['gte', 'lte'],
    }
    search_fields = [
        'title', 'content', 'tags__name',
        'category__name'
    ]
    ordering_fields = [
        'created_at', 'updated_at', 'last_reviewed_at',
        'review_count', 'priority'
    ]
    ordering = ['-is_pinned', '-updated_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return NoteListSerializer
        if self.action == 'retrieve':
            return NoteDetailSerializer
        return NoteSerializer

    def get_queryset(self):
        # Base queryset with optimized joins
        queryset = Note.objects.select_related('category').prefetch_related(
            'tags',
            'sharednote_set__shared_with'
        )

        # Filter by ownership or shared access
        queryset = queryset.filter(
            Q(user=self.request.user) |
            Q(sharednote__shared_with=self.request.user)
        ).distinct()

        # Apply additional filters from query params
        tags = self.request.query_params.getlist('tags')
        if tags:
            queryset = queryset.filter(tags__name__in=tags)

        needs_review = self.request.query_params.get('needs_review')
        if needs_review:
            now = timezone.now()
            queryset = queryset.filter(
                Q(last_reviewed_at__isnull=True) |
                Q(last_reviewed_at__lte=now - timedelta(days=1))
            )

        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        if self.request.method in ['POST', 'PUT', 'PATCH']:
            context['tags'] = self.request.data.get('tags', [])
        return context

    @action(detail=True, methods=['post'])
    def mark_reviewed(self, request, pk=None):
        """Marquer une note comme révisée."""
        note = self.get_object()
        success = request.data.get('success', True)
        
        with transaction.atomic():
            if success:
                note.mark_reviewed()
            note.review_count += 1
            note.save()

        serializer = self.get_serializer(note)
        return Response(serializer.data)

    @action(detail=False)
    def due_for_review(self, request):
        """Récupérer toutes les notes qui doivent être révisées."""
        cache_key = f'notes_due_review_{request.user.id}'
        cached_data = cache.get(cache_key)

        if cached_data is None:
            notes = self.get_queryset().filter(needs_review=True)
            serializer = self.get_serializer(notes, many=True)
            cached_data = serializer.data
            cache.set(cache_key, cached_data, 300)  # Cache for 5 minutes

        return Response(cached_data)

    @action(detail=False)
    def statistics(self, request):
        """Récupérer des statistiques détaillées sur les notes."""
        queryset = self.get_queryset()
        now = timezone.now()
        
        stats = {
            'total_notes': queryset.count(),
            'notes_by_type': {},
            'notes_by_priority': {},
            'review_stats': {
                'due_now': queryset.filter(needs_review=True).count(),
                'reviewed_today': queryset.filter(
                    last_reviewed_at__date=now.date()
                ).count(),
                'reviewed_this_week': queryset.filter(
                    last_reviewed_at__gte=now - timedelta(days=7)
                ).count(),
            },
            'creation_stats': {
                'created_today': queryset.filter(
                    created_at__date=now.date()
                ).count(),
                'created_this_week': queryset.filter(
                    created_at__gte=now - timedelta(days=7)
                ).count(),
            },
            'tag_stats': Tag.objects.filter(
                user=request.user
            ).annotate(
                notes_count=Count('note')
            ).values('name', 'notes_count'),
        }

        # Notes by type
        for note_type, label in Note.TYPE_CHOICES:
            count = queryset.filter(note_type=note_type).count()
            stats['notes_by_type'][label] = count

        # Notes by priority
        for priority, label in Note.PRIORITY_CHOICES:
            count = queryset.filter(priority=priority).count()
            stats['notes_by_priority'][label] = count

        return Response(stats)

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        """Partager une note avec d'autres utilisateurs."""
        note = self.get_object()
        serializer = SharedNoteSerializer(
            data=request.data,
            context={'request': request, 'note_id': note.id}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Créer une copie de la note."""
        original_note = self.get_object()
        new_note = Note.objects.create(
            user=request.user,
            title=f"Copy of {original_note.title}",
            content=original_note.content,
            category=original_note.category,
            note_type=original_note.note_type,
            priority=original_note.priority
        )
        new_note.tags.set(original_note.tags.all())
        
        serializer = self.get_serializer(new_note)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class SharedNoteViewSet(viewsets.ModelViewSet):
    serializer_class = SharedNoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SharedNote.objects.select_related(
            'note', 'note__category', 'shared_with'
        ).filter(
            Q(shared_with=self.request.user) |
            Q(note__user=self.request.user)
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['note_id'] = self.request.data.get('note')
        return context

    def perform_destroy(self, instance):
        if instance.note.user != self.request.user:
            raise PermissionDenied(
                "Only the note owner can remove sharing."
            )
        instance.delete()

    @action(detail=False)
    def shared_with_me(self, request):
        """Récupérer toutes les notes partagées avec l'utilisateur."""
        shared_notes = self.get_queryset().filter(
            shared_with=request.user
        )
        serializer = self.get_serializer(shared_notes, many=True)
        return Response(serializer.data)

    @action(detail=False)
    def shared_by_me(self, request):
        """Récupérer toutes les notes que l'utilisateur a partagées."""
        shared_notes = self.get_queryset().filter(
            note__user=request.user
        )
        serializer = self.get_serializer(shared_notes, many=True)
        return Response(serializer.data)