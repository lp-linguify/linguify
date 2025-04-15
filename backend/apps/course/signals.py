from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from .models import Lesson, Unit
from django.db import transaction
import logging

logger = logging.getLogger(__name__)

@receiver(pre_save, sender=Lesson)
def store_previous_unit(sender, instance, **kwargs):
    """
    Stocke l'unité précédente avant que la leçon ne soit modifiée
    """
    if instance.pk:  # S'assurer que ce n'est pas une nouvelle leçon
        try:
            previous = Lesson.objects.get(pk=instance.pk)
            # Stocker temporairement l'ID de l'unité précédente
            instance._previous_unit_id = previous.unit_id
            # Log pour déboguer
            if previous.unit_id != instance.unit_id:
                logger.info(f"Déplacement détecté: Leçon {instance.pk} ({instance.title_en}) "
                           f"de l'unité {previous.unit_id} vers {instance.unit_id}")
        except Lesson.DoesNotExist:
            instance._previous_unit_id = None
    else:
        instance._previous_unit_id = None

@receiver(post_save, sender=Lesson)
def update_unit_description_on_lesson_change(sender, instance, created, **kwargs):
    """
    Met à jour les descriptions des unités concernées quand une leçon est ajoutée ou modifiée
    """
    # Mise à jour de la nouvelle unité
    if instance.unit:
        logger.info(f"Signal: Mise à jour de l'unité {instance.unit.id}")
        instance.unit.save(update_descriptions=True)
    
    # Mise à jour de l'ancienne unité
    previous_unit_id = getattr(instance, '_previous_unit_id', None)
    if previous_unit_id and previous_unit_id != getattr(instance.unit, 'id', None):
        try:
            previous_unit = Unit.objects.get(id=previous_unit_id)
            logger.info(f"Signal: Mise à jour de l'unité précédente {previous_unit.id}")
            previous_unit.save(update_descriptions=True)
        except Unit.DoesNotExist:
            logger.warning(f"L'unité précédente {previous_unit_id} n'existe plus")

@receiver(post_delete, sender=Lesson)
def update_unit_description_on_lesson_delete(sender, instance, **kwargs):
    """
    Met à jour les descriptions de l'unité quand une leçon est supprimée
    """
    if instance.unit_id:
        try:
            unit = Unit.objects.get(id=instance.unit_id)
            logger.info(f"Signal: Mise à jour de l'unité {unit.id} après suppression")
            unit.save(update_descriptions=True)
        except Unit.DoesNotExist:
            logger.warning(f"L'unité {instance.unit_id} n'existe plus")


