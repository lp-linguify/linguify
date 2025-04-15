# backend/chat/url.py
from django.urls import path
from . import api
from . import consumers

app_name = 'chat'

urlpatterns = [
    path('', api.conversations_list, name='api_conversations_list'),
    path('start/<uuid:user_id>/', api.conversations_start, name='api_conversations_start'),
    path('<uuid:pk>/', api.conversations_detail, name='api_conversations_detail'),
]
