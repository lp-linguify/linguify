# authentication/urls.py
from django.urls import path
from .views import (
    auth0_login, 
    auth0_callback, 
    auth0_logout, 
    get_me, 
    user_settings,
    token_refresh, 
    user_profile, 
    update_profile_picture,
    debug_profile_endpoint
)
from django.conf import settings
from .debug_views import cors_debug

urlpatterns = [
    path('login/', auth0_login, name='auth0_login'),
    path('callback/', auth0_callback, name='auth0_callback'),
    path('logout/', auth0_logout, name='auth0_logout'),
    path('me/', get_me, name='get_me'),
    path('me/settings/', user_settings, name='user_settings'),
    path('token/refresh/', token_refresh, name='token_refresh'),
    path('profile/', user_profile, name='user_profile'),
    path('profile-picture/', update_profile_picture, name='user_profile_picture'),
    path('debug-profile/', debug_profile_endpoint, name='debug_profile'),
]

if settings.DEBUG:
    urlpatterns += [
        path('cors-debug/', cors_debug, name='cors_debug'),
    ]