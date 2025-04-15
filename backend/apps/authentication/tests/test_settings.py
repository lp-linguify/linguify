# authentication/tests/test_settings.py
"""
Configuration spéciale pour les tests de base de données.
Ce fichier peut être importé dans vos tests ou dans conftest.py
"""

# Configuration de la base de données de test
TEST_DB = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'test_db_linguify1',
        'USER': 'postgres',
        'PASSWORD': 'azerty',
        'HOST': 'localhost',
        'PORT': '5432',
        'TEST': {
            'NAME': 'test_db_linguify1',
            'CHARSET': 'UTF8',
        }
    }
}

# Configuration pour utiliser une base de données SQLite en mémoire
SQLITE_MEMORY_DB = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Configuration avec les paramètres Auth0/Okta
AUTH0_SETTINGS = {
    'AUTH0_DOMAIN': 'dev-7qe275o831ebkhbj.eu.auth0.com',
    'AUTH0_CLIENT_ID': 'ctNt07qaUrHRnWtHkXoA7QFd3jodpXNu',
    'AUTH0_CLIENT_SECRET': 'IfdLQfxjTpLviHxUWwfjvoUBW7kcmJ9_y0IDy3ASoDnqy0diI9MEaiqej7JUKecG',
    'AUTH0_AUDIENCE': 'https://linguify-api',
    'FRONTEND_URL': 'http://localhost:3000',
    'FRONTEND_CALLBACK_URL': 'http://localhost:3000/callback',
    'FRONTEND_LOGOUT_REDIRECT': 'http://localhost:3000'
}