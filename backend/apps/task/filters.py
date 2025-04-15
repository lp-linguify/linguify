from django_filters import rest_framework as filters

from .models import Item

class ItemFilter(filters.FilterSet):
    order = filters.OrderingFilter(fields=["created_at", "updated_at"])

    class Meta:
        model = Item
        fields = {"status": ["exact"]}


        