# authentication/views.py
from rest_framework import status
from django.http import JsonResponse
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, ProfileUpdateSerializer


from rest_framework.response import Response
import requests
from urllib.parse import urlencode
import logging

User = get_user_model()
logger = logging.getLogger(__name__)



@api_view(['GET'])
@permission_classes([AllowAny])
def auth0_login(request):
    """Generates the Auth0 login URL"""
    try:
        params = {
            'client_id': settings.AUTH0_CLIENT_ID,
            'redirect_uri': settings.FRONTEND_CALLBACK_URL,
            'response_type': 'code',
            'scope': 'openid profile email',
            'audience': settings.AUTH0_AUDIENCE
        }
        
        auth_url = f'https://{settings.AUTH0_DOMAIN}/authorize?{urlencode(params)}'
        return JsonResponse({'auth_url': auth_url})
    except Exception as e:
        logger.error(f"Auth0 login error: {str(e)}")
        return JsonResponse({'error': 'Authentication service unavailable'}, 
                          status=status.HTTP_503_SERVICE_UNAVAILABLE)

@api_view(['GET'])
@permission_classes([AllowAny])
def auth0_callback(request):
    """Handles the Auth0 callback and exchanges code for tokens"""
    try:
        code = request.GET.get('code')
        
        if not code:
            return JsonResponse({'error': 'Authorization code missing'}, 
                             status=status.HTTP_400_BAD_REQUEST)

        token_payload = {
            'grant_type': 'authorization_code',
            'client_id': settings.AUTH0_CLIENT_ID,
            'client_secret': settings.AUTH0_CLIENT_SECRET,
            'code': code,
            'redirect_uri': settings.FRONTEND_CALLBACK_URL
        }

        token_response = requests.post(
            f'https://{settings.AUTH0_DOMAIN}/oauth/token',
            data=token_payload,
            timeout=10
        )
        
        if token_response.status_code != 200:
            return JsonResponse({'error': 'Failed to obtain token'}, 
                             status=status.HTTP_401_UNAUTHORIZED)

        tokens = token_response.json()
        return JsonResponse({
            'access_token': tokens['access_token'],
            'id_token': tokens.get('id_token'),
            'expires_in': tokens['expires_in']
        })

    except Exception as e:
        logger.exception("Callback processing failed")
        return JsonResponse({'error': 'Authentication failed'}, 
                         status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def auth0_logout(request):
    """Handles user logout"""
    try:
        logout_url = f'https://{settings.AUTH0_DOMAIN}/v2/logout'
        params = {
            'client_id': settings.AUTH0_CLIENT_ID,
            'returnTo': settings.FRONTEND_LOGOUT_REDIRECT
        }
        return JsonResponse({'logout_url': f'{logout_url}?{urlencode(params)}'})
    
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return JsonResponse({'error': 'Logout failed'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def get_me(request):
    """
    GET: Returns the current authenticated user's information
    PATCH: Updates the current authenticated user's information
    """
    try:
        user = request.user
        
        if request.method == 'GET':
            # Create a comprehensive response with user information
            data = {
                'id': str(user.id),
                'public_id': str(user.public_id) if hasattr(user, 'public_id') else None,
                'email': user.email,
                'name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'picture': request.build_absolute_uri(user.profile_picture.url) if hasattr(user, 'profile_picture') and user.profile_picture else None,
                'language_level': user.language_level,
                'native_language': user.native_language,
                'target_language': user.target_language,
                'objectives': user.objectives,
                'bio': user.bio,
                'is_coach': user.is_coach,
                'is_subscribed': user.is_subscribed,
                'is_active': user.is_active,
                'authenticated': True
            }
            return JsonResponse(data)
        
        elif request.method == 'PATCH':
            # Update user information
            data = request.data
            
            # Update basic info
            if 'username' in data:
                user.username = data['username']
            if 'first_name' in data:
                user.first_name = data['first_name']
            if 'last_name' in data:
                user.last_name = data['last_name']
            if 'bio' in data:
                user.bio = data['bio']
            
            # Update language settings
            if 'native_language' in data:
                user.native_language = data['native_language']
            if 'target_language' in data:
                user.target_language = data['target_language']
            if 'language_level' in data:
                user.language_level = data['language_level']
            if 'objectives' in data:
                user.objectives = data['objectives']
            
            # Gender and birthday
            if 'gender' in data:
                user.gender = data['gender']
            if 'birthday' in data:
                user.birthday = data['birthday']
            
            user.save()
            
            # Return updated user info
            return JsonResponse({
                'id': str(user.id),
                'email': user.email,
                'name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'picture': request.build_absolute_uri(user.profile_picture.url) if hasattr(user, 'profile_picture') and user.profile_picture else None,
                'language_level': user.language_level,
                'native_language': user.native_language,
                'target_language': user.target_language,
                'objectives': user.objectives,
                'bio': user.bio,
                'gender': user.gender,
                'birthday': user.birthday,
                'is_coach': user.is_coach,
                'is_subscribed': user.is_subscribed,
                'authenticated': True
            })
            
    except Exception as e:
        logger.error(f"Error processing user data: {str(e)}")
        return JsonResponse({'error': 'Internal server error'}, 
                         status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def user_settings(request):
    """
    GET: Retrieve user settings
    POST: Save user settings
    """
    user = request.user
    
    if request.method == 'GET':
        # Get settings from user profile or defaults
        settings = {
            # Account settings
            'email_notifications': getattr(user, 'email_notifications', True),
            'push_notifications': getattr(user, 'push_notifications', True),
            'interface_language': getattr(user, 'interface_language', 'en'),
            
            # Learning settings
            'daily_goal': getattr(user, 'daily_goal', 15),
            'weekday_reminders': getattr(user, 'weekday_reminders', True),
            'weekend_reminders': getattr(user, 'weekend_reminders', False),
            'reminder_time': getattr(user, 'reminder_time', '18:00'),
            'speaking_exercises': getattr(user, 'speaking_exercises', True),
            'listening_exercises': getattr(user, 'listening_exercises', True),
            'reading_exercises': getattr(user, 'reading_exercises', True),
            'writing_exercises': getattr(user, 'writing_exercises', True),
            
            # Language settings
            'native_language': user.native_language,
            'target_language': user.target_language,
            'language_level': user.language_level,
            'objectives': user.objectives,
            
            # Privacy settings
            'public_profile': getattr(user, 'public_profile', True),
            'share_progress': getattr(user, 'share_progress', True),
            'share_activity': getattr(user, 'share_activity', False),
        }
        
        return Response(settings)
    
    elif request.method == 'POST':
        settings_data = request.data
        
        # Update language settings on the user model
        if 'native_language' in settings_data:
            user.native_language = settings_data['native_language']
            
        if 'target_language' in settings_data:
            user.target_language = settings_data['target_language']
            
        if 'language_level' in settings_data:
            user.language_level = settings_data['language_level']
            
        if 'objectives' in settings_data:
            user.objectives = settings_data['objectives']
            
        # For other settings, we'll store them as model attributes 
        # (They'll be saved even if not in the model fields explicitly)
        for key, value in settings_data.items():
            if key not in ['native_language', 'target_language', 'language_level', 'objectives']:
                setattr(user, key, value)
                
        user.save()
        
        return Response({
            'message': 'Settings saved successfully',
            'settings': settings_data
        })




@api_view(['POST'])
@permission_classes([IsAuthenticated])
def token_refresh(request):
    """Refresh a JWT token"""
    try:
        refresh_token = request.data.get('refresh_token')
        if not refresh_token:
            return JsonResponse({'error': 'Refresh token is required'}, status=400)
            
        payload = {
            'grant_type': 'refresh_token',
            'client_id': settings.AUTH0_CLIENT_ID,
            'client_secret': settings.AUTH0_CLIENT_SECRET,
            'refresh_token': refresh_token
        }
        
        response = requests.post(
            f'https://{settings.AUTH0_DOMAIN}/oauth/token',
            json=payload
        )
        
        if response.status_code != 200:
            return JsonResponse({'error': 'Failed to refresh token'}, status=401)
            
        return JsonResponse(response.json())
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        return JsonResponse({'error': 'Internal server error'}, status=500)
    
@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def user_profile(request):
    """
    GET: Retrieve current user profile
    PATCH: Update current user profile
    """
    user = request.user
    
    if request.method == 'GET':
        try:
            serializer = UserSerializer(user)
            return Response(serializer.data)
        except Exception as e:
            logger.exception(f"Error serializing user profile: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve user profile', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    elif request.method == 'PATCH':
        try:
            logger.info(f"Updating profile for user {user.email}")
            logger.debug(f"Update data: {request.data}")
            
            serializer = ProfileUpdateSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                logger.info(f"Profile updated successfully for {user.email}")
                return Response(serializer.data)
            
            logger.error(f"Profile update validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception(f"Error updating user profile: {str(e)}")
            return Response(
                {'error': 'Failed to update profile', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def update_profile_picture(request):
    """
    Update user profile picture
    """
    user = request.user
    
    if 'profile_picture' not in request.FILES:
        return Response({'error': 'No profile picture provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Delete existing profile picture if any
        if user.profile_picture:
            user.profile_picture.delete(save=False)
        
        # Save new profile picture
        user.profile_picture = request.FILES['profile_picture']
        user.save()
        
        # Get full URL for the profile picture
        if user.profile_picture:
            picture_url = request.build_absolute_uri(user.profile_picture.url)
        else:
            picture_url = None
        
        return Response({
            'message': 'Profile picture updated successfully',
            'profile_picture': picture_url
        })
        
    except Exception as e:
        logger.exception(f"Error updating profile picture: {str(e)}")
        return Response(
            {'error': 'Failed to update profile picture'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def debug_profile_endpoint(request):
    """
    Debug endpoint to trace profile API issues
    """
    import sys
    import traceback
    
    try:
        # Get basic request info
        request_info = {
            'method': request.method,
            'path': request.path,
            'auth': request.auth is not None,
            'user': str(request.user),
            'is_authenticated': request.user.is_authenticated,
            'headers': dict(request.headers),
        }
        
        # Try to access user data safely
        user_data = None
        if request.user.is_authenticated:
            try:
                user = request.user
                user_data = {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_active': user.is_active,
                }
            except Exception as e:
                user_data = {'error': str(e)}
        
        # Try actual profile serialization
        serializer_data = None
        if request.user.is_authenticated:
            try:
                from .serializers import UserSerializer
                serializer = UserSerializer(request.user)
                serializer_data = serializer.data
            except Exception as e:
                serializer_data = {'error': str(e), 'traceback': traceback.format_exc()}
        
        return Response({
            'request_info': request_info,
            'user_data': user_data,
            'serializer_data': serializer_data,
            'python_version': sys.version,
            'success': True
        })
    except Exception as e:
        # Capture full error info
        return Response({
            'error': str(e),
            'traceback': traceback.format_exc(),
            'success': False
        }, status=500)



