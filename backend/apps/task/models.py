from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy

class Item(models.Model):
    class Status(models.IntegerChoices):
        TODO = 0, gettext_lazy("Pending")
        WIP = 1, gettext_lazy("Work in Progress")
        DONE = 2, gettext_lazy("Done")

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name=gettext_lazy("items"),
        verbose_name=gettext_lazy("User"),
        )
    
    content = models.CharField(gettext_lazy("Content"), max_length=255)
    status = models.IntegerField(gettext_lazy("Status"), choices=Status.choices, default=Status.TODO)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=gettext_lazy("Created at"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=gettext_lazy("Updated at"))

    class Meta:
        verbose_name = gettext_lazy("Item")
        verbose_name_plural = gettext_lazy("Items")
        ordering = ["-created_at"]

