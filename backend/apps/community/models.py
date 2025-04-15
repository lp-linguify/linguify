from authentication.models import User
from django.db import models

import time


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True, null=True, help_text="Brève description de l'utilisateur")
    learning_languages = models.JSONField(
        blank=True,
        null=True,
        help_text="Langues que l'utilisateur souhaite apprendre, exemple : ['French', 'Spanish']"
    )
    teaching_languages = models.JSONField(
        blank=True,
        null=True,
        help_text="Langues que l'utilisateur peut enseigner, exemple : ['English', 'German']"
    )
    friends = models.ManyToManyField('self', blank=True, symmetrical=False, related_name='friends_with')
    blocked_users = models.ManyToManyField('self', blank=True, symmetrical=False, related_name='blocked_by')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, help_text="Photo de profil")
    is_online = models.BooleanField(default=False, help_text="Statut en ligne de l'utilisateur")

    def __str__(self):
        return self.user.username

    def mutual_friends(self, other_user):
        """Renvoie une liste des amis communs avec un autre utilisateur"""
        return self.friends.filter(id__in=other_user.profile.friends.values_list('id', flat=True))

    def friend_requests_sent(self):
        """Renvoie une liste des demandes d'amis envoyées par l'utilisateur"""
        return FriendRequest.objects.filter(sender=self.user)

    def friend_requests_received(self):
        """Renvoie une liste des demandes d'amis reçues par l'utilisateur"""
        return FriendRequest.objects.filter(receiver=self.user)

    def unread_notifications(self):
        """Renvoie une liste des notifications non lues de l'utilisateur"""
        return Notification.objects.filter(recipient=self, is_read=False)

    def unread_messages(self):
        """Renvoie une liste des messages non lus de l'utilisateur"""
        return ChatMessage.objects.filter(receiver=self, is_read=False)

    def unread_group_messages(self):
        return GroupMessage.objects.filter(group__members=self, is_read=False)

    def suggest_friends(self):
        """Renvoie une liste de profils suggérés basés sur des amis communs ou langues partagées."""
        suggested = Profile.objects.filter(learning_languages__overlap=self.teaching_languages).exclude(id__in=self.friends.all()).exclude(id=self.id)
        return suggested
class Post(models.Model):
    title = models.CharField(max_length=100, null=True, blank=True)
    content = models.TextField(null=False, blank=False, max_length=5000, help_text="Post content", verbose_name="Post Content")
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    likes = models.ManyToManyField(User, related_name='likes_posts', blank=True)
    reposts = models.ManyToManyField(User, related_name='reposts', blank=True)

    def __str__(self):
        return f"{self.title} by {self.author}"

    class Meta:
        ordering = ['-created_at']

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    likes = models.ManyToManyField(User, related_name='likes_comments', blank=True)

    def __str__(self):
        return f"Comment by {self.author} on {self.post.title}"

class FriendRequest(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_requests')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_requests')
    status = models.CharField(max_length=10,
                              choices=[('pending', 'pending'), ('accepted', 'accepted'), ('rejected', 'rejected')],
                              default='pending')

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender} sent a friend request to {self.receiver}"

class FriendList(models.Model):
    owner = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='friend_lists')
    name = models.CharField(max_length=100)
    friends = models.ManyToManyField(Profile, related_name='listed_in')

    def __str__(self):
        return f"{self.owner.user.username}'s {self.name}"

class Conversation(models.Model):
    participants = models.ManyToManyField(Profile, related_name='conversations')
    last_message = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Conversation between {', '.join([p.user.username for p in self.participants.all()])}"

class ChatMessage(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='received_messages')
    message = models.TextField()
    media = models.FileField(upload_to='chat/media/', blank=True, null=True)
    is_read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender.user.username} -> {self.receiver.user.username} ({self.timestamp})"

class Group(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True, help_text="Description du groupe")
    members = models.ManyToManyField(Profile, related_name='groups', blank=True)
    created_by = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='created_groups')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Badge(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.ImageField(upload_to='badges/icons/')
    awarded_users = models.ManyToManyField(Profile, related_name='badges', blank=True)

    def __str__(self):
        return self.name

class GroupMessage(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(Profile, on_delete=models.CASCADE)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message in {self.group.name} by {self.sender.user.username}"

class Notification(models.Model):
    recipient = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='notifications')
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.recipient.user.username}"

class Recommendation(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='recommendations')
    suggested_profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='suggested_to')
    reason = models.CharField(max_length=255, blank=True, null=True, help_text="Raison pour cette recommandation")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Recommendation for {self.profile.user.username} -> {self.suggested_profile.user.username}"

def generate_recommendations(profile):
    """Génère des recommandations d'amis pour un profil."""
    potential_friends = Profile.objects.filter(
        learning_languages__overlap=profile.teaching_languages
    ).exclude(
        id=profile.id
    ).exclude(
        id__in=profile.friends.all()
    )
    for suggested_profile in potential_friends:
        Recommendation.objects.get_or_create(profile=profile, suggested_profile=suggested_profile)

class Story(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='stories')
    content_type = models.CharField(max_length=10, choices=[('text', 'Text'), ('image', 'Image'), ('video', 'Video')])
    content = models.TextField(blank=True, null=True)
    media = models.FileField(upload_to='stories/media/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def __str__(self):
        return f"Story by {self.profile.user.username}"

    def is_expired(self):
        return self.expires_at < time.now()

class Reputation(models.Model):
    profile = models.OneToOneField(Profile, on_delete=models.CASCADE, related_name='reputation')
    points = models.IntegerField(default=0)
    level = models.CharField(max_length=50, default='Beginner')

    def update_level(self):
        if self.points >= 1000:
            self.level = 'Expert'
        elif self.points >= 500:
            self.level = 'Intermediate'
        else:
            self.level = 'Beginner'
        self.save()

    def __str__(self):
        return f"{self.profile.user.username} - {self.points} points ({self.level})"

class UserStatistics(models.Model):
    profile = models.OneToOneField(Profile, on_delete=models.CASCADE, related_name='statistics')
    total_friends = models.IntegerField(default=0)
    total_messages = models.IntegerField(default=0)
    total_help_sessions = models.IntegerField(default=0)

    def __str__(self):
        return f"Stats for {self.profile.user.username}"

class Report(models.Model):
    reported_by = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='reports_filed')
    reported_profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='reports_received')
    reason = models.TextField()
    resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Report by {self.reported_by.user.username} against {self.reported_profile.user.username}"

class ActivityFeed(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='activity_feeds')
    activity_type = models.CharField(max_length=50, choices=[('post', 'Post'), ('comment', 'Comment'), ('like', 'Like')])
    activity_data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Activity for {self.profile.user.username} - {self.activity_type}"
