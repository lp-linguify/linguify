from rest_framework import serializers
from django.utils import timezone
from .models import Note, NoteCategory, Tag, SharedNote

class TagSerializer(serializers.ModelSerializer):
    notes_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Tag
        fields = ['id', 'name', 'color', 'notes_count']
        
    def get_notes_count(self, obj):
        return obj.note_set.count()

    def validate_name(self, value):
        user = self.context['request'].user
        if Tag.objects.filter(name__iexact=value, user=user).exists():
            raise serializers.ValidationError("A tag with this name already exists")
        return value.lower()

    def validate_color(self, value):
        if not value.startswith('#'):
            raise serializers.ValidationError("Color must be a valid hex color code starting with #")
        if len(value) != 7:
            raise serializers.ValidationError("Color must be in #RRGGBB format")
        return value

    def create(self, validated_data):
        user = self.context['request'].user
        return Tag.objects.create(user=user, **validated_data)

class NoteCategorySerializer(serializers.ModelSerializer):
    subcategories = serializers.SerializerMethodField()
    notes_count = serializers.SerializerMethodField()
    path = serializers.SerializerMethodField()
    notes = serializers.SerializerMethodField()
    parent_name = serializers.CharField(source='parent.name', read_only=True)

    class Meta:
        model = NoteCategory
        fields = [
            'id', 'name', 'description', 'parent', 'parent_name',
            'created_at', 'subcategories', 'notes_count', 'path', 'notes'
        ]
        read_only_fields = ['created_at']

    def get_subcategories(self, obj):
        subcategories = NoteCategory.objects.filter(parent=obj)
        return NoteCategorySerializer(subcategories, many=True, context=self.context).data

    def get_notes_count(self, obj):
        return obj.note_set.count()

    def get_path(self, obj):
        """Retourne le chemin complet de la catégorie (ex: Root > Parent > Child)"""
        path = []
        current = obj
        while current is not None:
            path.append(current.name)
            current = current.parent
        return ' > '.join(reversed(path))

    def get_notes(self, obj):
        """Retourne les 5 dernières notes de la catégorie"""
        notes = obj.note_set.all()[:5]
        from .serializers import NoteListSerializer
        return NoteListSerializer(notes, many=True, context=self.context).data

    def validate_name(self, value):
        user = self.context['request'].user
        parent = self.initial_data.get('parent')
        if NoteCategory.objects.filter(
            name__iexact=value,
            user=user,
            parent_id=parent
        ).exists():
            raise serializers.ValidationError(
                "A category with this name already exists at this level"
            )
        return value

    def validate_parent(self, value):
        if value and value.user != self.context['request'].user:
            raise serializers.ValidationError("Invalid parent category")
        return value

    def create(self, validated_data):
        user = self.context['request'].user
        return NoteCategory.objects.create(user=user, **validated_data)

class NoteListSerializer(serializers.ModelSerializer):
    """Serializer léger pour les listes de notes"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    is_due_for_review = serializers.SerializerMethodField()

    class Meta:
        model = Note
        fields = [
            'id', 'title', 'category_name', 'tags', 'note_type',
            'is_pinned', 'created_at', 'updated_at', 'is_due_for_review'
        ]

    def get_is_due_for_review(self, obj):
        return obj.needs_review

class NoteSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_path = serializers.SerializerMethodField()
    is_shared = serializers.SerializerMethodField()
    is_due_for_review = serializers.SerializerMethodField()
    time_until_review = serializers.SerializerMethodField()
    
    class Meta:
        model = Note
        fields = [
            'id', 'title', 'content', 'category', 'category_name',
            'category_path', 'tags', 'note_type', 'created_at', 'updated_at',
            'last_reviewed_at', 'review_count', 'is_pinned', 'is_archived',
            'priority', 'is_shared', 'is_due_for_review', 'time_until_review'
        ]
        read_only_fields = [
            'created_at', 'updated_at', 'last_reviewed_at',
            'review_count', 'is_shared', 'is_due_for_review'
        ]

    def get_category_path(self, obj):
        if not obj.category:
            return None
        return NoteCategorySerializer(obj.category).get_path(obj.category)

    def get_is_shared(self, obj):
        return obj.sharednote_set.exists()

    def get_is_due_for_review(self, obj):
        return obj.needs_review

    def get_time_until_review(self, obj):
        if not obj.last_reviewed_at:
            return "Due now"
        
        from datetime import timedelta
        intervals = {
            0: timedelta(days=1),
            1: timedelta(days=3),
            2: timedelta(days=7),
            3: timedelta(days=14),
            4: timedelta(days=30),
            5: timedelta(days=60)
        }
        review_level = min(obj.review_count, 5)
        next_review = obj.last_reviewed_at + intervals[review_level]
        
        if next_review <= timezone.now():
            return "Due now"
        
        time_left = next_review - timezone.now()
        days = time_left.days
        
        if days == 0:
            hours = time_left.seconds // 3600
            if hours == 0:
                minutes = (time_left.seconds % 3600) // 60
                return f"{minutes} minutes"
            return f"{hours} hours"
        return f"{days} days"

    def validate_category(self, value):
        if value and value.user != self.context['request'].user:
            raise serializers.ValidationError("Invalid category")
        return value

    def create(self, validated_data):
        tags_data = self.context.get('tags', [])
        user = self.context['request'].user
        note = Note.objects.create(user=user, **validated_data)
        
        if tags_data:
            tags = Tag.objects.filter(id__in=tags_data, user=user)
            note.tags.set(tags)
        
        return note

    def update(self, instance, validated_data):
        tags_data = self.context.get('tags')
        note = super().update(instance, validated_data)
        
        if tags_data is not None:
            tags = Tag.objects.filter(id__in=tags_data, user=instance.user)
            note.tags.set(tags)
        
        return note

class SharedNoteSerializer(serializers.ModelSerializer):
    note = NoteSerializer(read_only=True)
    shared_with_username = serializers.CharField(source='shared_with.username', read_only=True)
    shared_with_email = serializers.EmailField(write_only=True)
    
    class Meta:
        model = SharedNote
        fields = [
            'id', 'note', 'shared_with', 'shared_with_username',
            'shared_with_email', 'shared_at', 'can_edit'
        ]
        read_only_fields = ['shared_at', 'shared_with']

    def validate_shared_with_email(self, value):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            user = User.objects.get(email=value)
            if user == self.context['request'].user:
                raise serializers.ValidationError(
                    "You cannot share a note with yourself"
                )
            self.context['shared_with'] = user
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "No user found with this email address"
            )

    def validate(self, attrs):
        note_id = self.context.get('note_id')
        shared_with = self.context.get('shared_with')
        
        if SharedNote.objects.filter(
            note_id=note_id,
            shared_with=shared_with
        ).exists():
            raise serializers.ValidationError(
                "This note is already shared with this user"
            )
        return attrs

    def create(self, validated_data):
        user = self.context['request'].user
        note_id = self.context.get('note_id')
        shared_with = self.context.get('shared_with')
        
        validated_data.pop('shared_with_email', None)
        note = Note.objects.get(id=note_id, user=user)
        
        return SharedNote.objects.create(
            note=note,
            shared_with=shared_with,
            **validated_data
        )

class NoteDetailSerializer(NoteSerializer):
    shared_with = SharedNoteSerializer(source='sharednote_set', many=True, read_only=True)
    revision_history = serializers.SerializerMethodField()
    
    class Meta(NoteSerializer.Meta):
        fields = NoteSerializer.Meta.fields + ['shared_with', 'revision_history']

    def get_revision_history(self, obj):
        """Retourne l'historique des révisions de la note"""
        reviews = []
        current_date = obj.last_reviewed_at
        
        for i in range(obj.review_count):
            reviews.append({
                'review_number': i + 1,
                'reviewed_at': current_date,
            })
        
        return reviews