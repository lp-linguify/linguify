# signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ChatMessage, Notification

@receiver(post_save, sender=ChatMessage)
def notify_receiver(sender, instance, created, **kwargs):
    if created:
        Notification.objects.create(
            recipient=instance.receiver,
            content=f"New message from {instance.sender.user.username}",
            link=f"/chat/{instance.conversation.id}/"
        )
