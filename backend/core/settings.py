# backend/core/settings.py
import sys
from pathlib import Path
import os
import environ
from datetime import timedelta

sys.path.insert(0, os.path.join(Path(__file__).resolve().parent.parent, 'apps'))
BASE_DIR = Path(__file__).resolve().parent.parent

# Initialiser environ.Env
env = environ.Env()

# Lire le fichier .env
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

# Paramètres Django utilisant les variables d'environnement
SECRET_KEY = env('SECRET_KEY')
DEBUG = env.bool('DEBUG', default=False)

# Paramètres de base
BACKEND_URL = env.str('BACKEND_URL', default='http://localhost:8000')
FRONTEND_URL = env.str('FRONTEND_URL', default='http://localhost:3000')

# normally Allowed hosts should be set to the domain name of the website
# but for development purposes we can set it to all
# normally, ALLOWED_HOSTS = ['yourdomain.com'] or empty in development mode
ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'yourdomain.com']    

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.humanize',
    'django_extensions',
    'django_filters',
    'channels',

    # Project django_apps
    'apps.authentication',
    # 'apps.chat',
    # 'apps.coaching',
    # 'apps.community',
    'apps.course',
    'apps.data',
    # 'apps.flashcard',
    # 'apps.payments',
    # 'apps.quiz',
    'apps.revision',
    'apps.notebook',
    # 'apps.task',
    'apps.progress',
    #'subscription',
    #'app_manager', # 'app_manager', # TODO: Uncomment when app_manager is ready
    
    

    # Django REST framework modules
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',


    # test
    'pytest_django',
]

AUTH_USER_MODEL = 'authentication.User'

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'django.contrib.auth.backends.RemoteUserBackend',
]

REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'authentication.auth0_auth.Auth0Authentication',  # Auth0 en premier
        # 'rest_framework.authentication.SessionAuthentication',
        # 'rest_framework.authentication.TokenAuthentication',
        # 'rest_framework.authentication.BasicAuthentication',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
}

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://linguify-api",
]


CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://linguify-api",
]

# En développement
if DEBUG:
    CSRF_USE_SESSIONS = False
    CSRF_COOKIE_HTTPONLY = False
    CSRF_COOKIE_SAMESITE = 'Lax'
    CSRF_COOKIE_SECURE = False
    SESSION_COOKIE_SECURE = False
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_HTTPONLY = True


AUTH0_DOMAIN = env('AUTH0_DOMAIN')
AUTH0_CLIENT_ID = env('AUTH0_CLIENT_ID')
AUTH0_CLIENT_SECRET = env('AUTH0_CLIENT_SECRET')
AUTH0_AUDIENCE = env('AUTH0_AUDIENCE')
AUTH0_CALLBACK_URL = f"{BACKEND_URL}/api/auth/callback/"
FRONTEND_URL = env('FRONTEND_URL', default='http://localhost:3000')
FRONTEND_CALLBACK_URL = f"{FRONTEND_URL}/callback"
FRONTEND_LOGOUT_REDIRECT = FRONTEND_URL
AUTH0_ALGORITHM = 'RS256'

JWT_AUTH = {
    'JWT_PAYLOAD_GET_USERNAME_HANDLER':
        'authentication.utils.jwt_get_username_from_payload_handler',
    'JWT_DECODE_HANDLER':
        'authentication.utils.jwt_decode_token',
    'JWT_ALGORITHM': 'RS256',
    'JWT_AUDIENCE': AUTH0_AUDIENCE,
    'JWT_ISSUER': f'https://{AUTH0_DOMAIN}/',
    'JWT_AUTH_HEADER_PREFIX': 'Bearer',
    'JWT_VERIFY_EXPIRATION': False, 
    'JWT_ALLOW_REFRESH': True,
    'JWT_EXPIRATION_DELTA': timedelta(days=7),
    'JWT_REFRESH_EXPIRATION_DELTA': timedelta(days=7),
}

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# in production, we can use redis for caching
# install redis and django-redis

# CACHES = {
#     'default': {
#         'BACKEND': 'django_redis.cache.RedisCache',
#         'LOCATION': 'redis://127.0.0.1:6379/1',
#         'OPTIONS': {
#             'CLIENT_CLASS': 'django_redis.client.DefaultClient',
#         }
#     }
# }


# Configuration de session - ajoutez ou modifiez cette section
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'
SESSION_COOKIE_NAME = 'linguify_session'
SESSION_COOKIE_AGE = 86400  # 1 jour en secondes
SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'

# Configuration de cache pour Auth0
AUTH0_TOKEN_CACHE_TIMEOUT = 3600  # 1 heure en secondes
AUTH0_USERINFO_CACHE_TIMEOUT = 3600  # 1 heure en secondes 

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.auth.middleware.RemoteUserMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'authentication.middleware.JWTMiddleware',
]

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers',
]

CORS_EXPOSE_HEADERS = [
    'access-control-allow-origin',
    'access-control-allow-credentials',
]

CORS_PREFLIGHT_MAX_AGE = 86400

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            BASE_DIR.joinpath('templates'),
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'
# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('DB_NAME'),
        'USER': env('DB_USER'),
        'PASSWORD': env('DB_PASSWORD'),
        'HOST': env('DB_HOST', default='localhost'),
        'PORT': env('DB_PORT', default='5432'),
    }
}
# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

USE_I18N = True
USE_L10N = True
USE_TZ = True

TIME_ZONE = 'UTC'
# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

STATIC_URL = '/static/'
MEDIA_URL = '/media/'
STATICFILES_DIRS = []

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

APPEND_SLASH = True



ASGI_APPLICATION = 'core.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('127.0.0.1', 6379)],
        },
    },
}

# Au début du fichier
import logging
logger = logging.getLogger(__name__)


LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'authentication': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}



# Configuration email pour l'envoi depuis les formulaires de contact
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'  # Ou votre fournisseur de mail
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'linguify.info@gmail.com'  # Remplacez par votre adresse email
EMAIL_HOST_PASSWORD = 'Sony728596'  # Mot de passe d'application pour Gmail
DEFAULT_FROM_EMAIL = 'Linguify <no-reply@linguify.com>'