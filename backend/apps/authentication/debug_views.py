from django.http import JsonResponse
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
import logging

logger = logging.getLogger(__name__)

@api_view(['GET', 'OPTIONS'])
@permission_classes([AllowAny])
def cors_debug(request):
    """
    Vue de diagnostic pour les problèmes CORS.
    À utiliser uniquement en développement.
    """
    if not settings.DEBUG:
        return JsonResponse({'error': 'Debug endpoint disabled in production'}, status=403)

    # Log detailed information about the request
    logger.debug("=== CORS Debug Information ===")
    logger.debug(f"Request Method: {request.method}")
    logger.debug(f"Request Path: {request.path}")
    
    logger.debug("\nRequest Headers:")
    for header, value in request.headers.items():
        logger.debug(f"{header}: {value}")

    logger.debug("\nCORS Settings:")
    logger.debug(f"CORS_ALLOWED_ORIGINS: {settings.CORS_ALLOWED_ORIGINS}")
    logger.debug(f"CORS_ALLOW_CREDENTIALS: {settings.CORS_ALLOW_CREDENTIALS}")
    logger.debug(f"CORS_ALLOW_HEADERS: {settings.CORS_ALLOW_HEADERS}")

    # Return detailed debug information
    return JsonResponse({
        'cors_debug': {
            'request': {
                'method': request.method,
                'path': request.path,
                'headers': dict(request.headers),
                'origin': request.headers.get('origin'),
            },
            'cors_settings': {
                'allowed_origins': settings.CORS_ALLOWED_ORIGINS,
                'allow_credentials': settings.CORS_ALLOW_CREDENTIALS,
                'allow_headers': settings.CORS_ALLOW_HEADERS,
            },
            'meta': {
                key: str(value)
                for key, value in request.META.items()
                if key.startswith('HTTP_') or key in ['REMOTE_ADDR', 'SERVER_NAME']
            }
        }
    })