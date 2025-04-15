# backend/authentication/middleware.py
import json
import jwt
import logging
import requests
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.cache import cache

User = get_user_model()
logger = logging.getLogger(__name__)

def get_user_info(token):
    """Get user info from Auth0 with rate limit handling"""
    # Check if we're already rate limited
    rate_limit_key = "auth0_rate_limited"
    if cache.get(rate_limit_key):
        logger.warning("Auth0 rate limit active, skipping userinfo call")
        return None, True
    
    try:
        # Check for cached userinfo by token hash
        token_hash = hash(token)
        cache_key = f"auth0_userinfo_{token_hash}"
        cached_info = cache.get(cache_key)
        
        if cached_info:
            logger.debug("Using cached user info")
            return cached_info, False
        
        user_info_url = f'https://{settings.AUTH0_DOMAIN}/userinfo'
        logger.debug(f"Getting user info from {user_info_url}")
        response = requests.get(
            user_info_url,
            headers={'Authorization': f'Bearer {token}'},
            timeout=5
        )
        
        # Handle rate limiting
        if response.status_code == 429:
            # Set rate limit flag for 5 minutes
            cache.set(rate_limit_key, True, 300)
            logger.error(f"Auth0 rate limit reached: {response.status_code}")
            logger.error(f"Response content: {response.text}")
            return None, True
        
        if response.status_code == 200:
            user_info = response.json()
            # Cache user info
            cache.set(cache_key, user_info, 3600)  # Cache for 1 hour
            return user_info, False
        
        logger.error(f"Failed to get user info: {response.status_code}")
        return None, False
    except Exception as e:
        logger.error(f"Error getting user info: {str(e)}")
        return None, False

class JWTMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.jwks = None
        self.jwks_last_fetched = 0
        self.jwks_cache_time = 86400  # 24 hours

    def fetch_jwks(self):
        """Fetch JWKS with caching"""
        # Check cache first
        cache_key = f"auth0_jwks_{settings.AUTH0_DOMAIN}"
        cached_jwks = cache.get(cache_key)
        if cached_jwks:
            logger.debug("Using cached JWKS")
            self.jwks = cached_jwks
            return self.jwks
            
        if not self.jwks:
            try:
                jwks_url = f'https://{settings.AUTH0_DOMAIN}/.well-known/jwks.json'
                logger.debug(f"Fetching JWKS from {jwks_url}")
                response = requests.get(jwks_url, timeout=5)
                if response.status_code == 200:
                    self.jwks = response.json()
                    # Cache JWKS
                    cache.set(cache_key, self.jwks, 3600)  # Cache for 1 hour
                    logger.debug("JWKS fetched and cached successfully")
                else:
                    logger.error(f"Failed to fetch JWKS: {response.status_code}")
            except Exception as e:
                logger.error(f"Error fetching JWKS: {str(e)}")
        
        return self.jwks

    def authenticate_token(self, token):
        """Verify JWT token with caching"""
        try:
            # Check token verification cache
            token_hash = hash(token)
            cache_key = f"auth0_verify_{token_hash}"
            cached_payload = cache.get(cache_key)
            
            if cached_payload:
                logger.debug("Using cached token verification")
                return cached_payload
            
            jwks = self.fetch_jwks()
            if not jwks:
                logger.error("No JWKS available for token verification")
                return None
                
            header = jwt.get_unverified_header(token)
            key = next((k for k in jwks['keys'] if k['kid'] == header['kid']), None)
            
            if not key:
                logger.error(f"No matching key found for kid: {header.get('kid')}")
                return None
                
            payload = jwt.decode(
                token,
                jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(key)),
                algorithms=['RS256'],
                audience=settings.AUTH0_AUDIENCE,
                issuer=f'https://{settings.AUTH0_DOMAIN}/'
            )
            
            # Cache successful verification
            if payload:
                # Determine cache time based on token expiration
                exp = payload.get('exp', 0)
                import time
                current_time = int(time.time())
                # Cache until token expiration or max 1 hour
                cache_time = min(exp - current_time, 3600) if exp > current_time else 3600
                if cache_time > 0:
                    cache.set(cache_key, payload, cache_time)
                    logger.debug(f"Token verification cached for {cache_time} seconds")
            
            return payload
        except Exception as e:
            logger.error(f"JWT Error: {str(e)}")
            return None

    def __call__(self, request):
        """Process request with optimized authentication"""
        # Skip processing if request already has auth user
        if hasattr(request, '_auth_middleware_user'):
            return self.get_response(request)
            
        auth_header = request.headers.get('Authorization')
        
        if auth_header and auth_header.startswith('Bearer '):
            try:
                token = auth_header.split()[1]
                
                # Check if we already have this user in session
                session_key = f"auth0_session_{hash(token)}"
                user_id = request.session.get(session_key)
                
                if user_id:
                    try:
                        user = User.objects.get(id=user_id)
                        logger.debug(f"Using session user: {user.username}")
                        request.user = user
                        request._auth_middleware_user = True
                        return self.get_response(request)
                    except User.DoesNotExist:
                        # User no longer exists, remove from session
                        del request.session[session_key]
                
                # Verify token
                payload = self.authenticate_token(token)
                
                if payload:
                    # Try to get email from payload
                    email = payload.get('email')
                    
                    if not email:
                        # Email not in token, try userinfo endpoint
                        user_info, rate_limited = get_user_info(token)
                        
                        if rate_limited:
                            # Handle rate limiting - use fallback user
                            try:
                                # Try to find user by sub claim
                                sub = payload.get('sub')
                                if sub:
                                    sub_id = sub.split('|')[-1]
                                    user = User.objects.filter(username__icontains=sub_id[:8]).first()
                                    if not user:
                                        # Fallback to most recent user
                                        user = User.objects.latest('created_at')
                                        
                                    if user:
                                        logger.warning(f"Using fallback user due to Auth0 rate limits: {user.username}")
                                        request.user = user
                                        # Store in session for future requests
                                        request.session[session_key] = user.id
                                        request._auth_middleware_user = True
                                        return self.get_response(request)
                            except User.DoesNotExist:
                                logger.error("No fallback user available")
                        elif user_info:
                            email = user_info.get('email')
                    
                    if email:
                        # Get or create user
                        user, created = User.objects.get_or_create(
                            email=email,
                            defaults={
                                'username': payload.get('nickname') or user_info.get('nickname') or email.split('@')[0],
                                'first_name': payload.get('given_name') or user_info.get('given_name', ''),
                                'last_name': payload.get('family_name') or user_info.get('family_name', '')
                            }
                        )
                        
                        # Update user if needed
                        if not created:
                            nickname = payload.get('nickname') or user_info.get('nickname')
                            given_name = payload.get('given_name') or user_info.get('given_name')
                            family_name = payload.get('family_name') or user_info.get('family_name')
                            
                            update_fields = []
                            if nickname and user.username != nickname:
                                user.username = nickname
                                update_fields.append('username')
                            if given_name and user.first_name != given_name:
                                user.first_name = given_name
                                update_fields.append('first_name')
                            if family_name and user.last_name != family_name:
                                user.last_name = family_name
                                update_fields.append('last_name')
                            
                            if update_fields:
                                user.save(update_fields=update_fields)
                        
                        # Attach user to request
                        request.user = user
                        # Store in session for future requests
                        request.session[session_key] = user.id
                        request._auth_middleware_user = True
                    else:
                        logger.error("No email found in payload or user info")
                else:
                    logger.error("Invalid token")
            except Exception as e:
                logger.error(f"Error in JWT middleware: {str(e)}")
        
        return self.get_response(request)