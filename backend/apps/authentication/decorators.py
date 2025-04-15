from functools import wraps
from django.http import JsonResponse
from rest_framework import status

def require_auth0_user(view_func):
    @wraps(view_func)
    def wrapped_view(request, *args, **kwargs):
        if not hasattr(request, 'auth0_user'):
            return JsonResponse(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        return view_func(request, *args, **kwargs)
    return wrapped_view

def coach_required(view_func):
    @wraps(view_func)
    def wrapped_view(request, *args, **kwargs):
        if not request.user.is_coach:
            return JsonResponse(
                {'error': 'Coach privileges required'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        return view_func(request, *args, **kwargs)
    return wrapped_view