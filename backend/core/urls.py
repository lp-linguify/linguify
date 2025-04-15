# backend/core/urls.py
from django.shortcuts import redirect
from django.contrib import admin
from django.urls import path, include
from . import utils
from . import views

def redirect_to_admin(request):
    return redirect('admin/')

urlpatterns = [
    path('', redirect_to_admin),
    path('admin/', admin.site.urls),
    path('csrf/', utils.get_csrf_token, name='get_csrf_token'),
    path('api/', include('rest_framework.urls')),
    path('api/auth/', include('authentication.urls')),
    path('api/v1/course/', include('course.urls', namespace='course')),
    path('api/v1/revision/', include('revision.urls', namespace='revision')),
    path('api/v1/notebook/', include('notebook.urls', namespace='notebook')),
    path('api/contact/', views.contact_view, name='contact'),
    path('api/v1/progress/', include('progress.urls', namespace='progress')),
    # path('api/v1/flashcard/', include('flashcard.urls', namespace='flashcard')),
    # path('api/v1/task/', include('task.urls', namespace='task')),
    # path('api/v1/chat/', include('chat.urls', namespace='chat')),

]
