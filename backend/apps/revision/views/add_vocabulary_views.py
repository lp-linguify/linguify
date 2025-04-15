# backend/revision/views/add_vocabulary_views.py
from rest_framework import viewsets
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models.add_vocabulary import CreateRevisionList
from ..serializers import CreateRevisionListSerializer, AddFieldSerializer


class CreateRevisionListViewSet(viewsets.ModelViewSet):
    serializer_class = CreateRevisionListSerializer

    def get_queryset(self):
        return CreateRevisionList.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def add_field(self, request, pk=None):
        revision_list = self.get_object()
        serializer = AddFieldSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user, revision_list=revision_list)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def fields(self, request, pk=None):
        revision_list = self.get_object()
        fields = revision_list.fields.all()
        serializer = AddFieldSerializer(fields, many=True)
        return Response(serializer.data)
    
    