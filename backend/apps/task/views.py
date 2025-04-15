from django.shortcuts import render
from rest_framework import viewsets
from .filters import ItemFilter
from .models import Item
from .serializers import ItemSerializer

class ItemViewSet(viewsets.ModelViewSet):
    filtered_class = ItemFilter
    serializer_class = ItemSerializer
    queryset = Item.objects.all()

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)