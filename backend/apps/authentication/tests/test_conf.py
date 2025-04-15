# backend/apps/authentication/tests/conftest.py
"""
Configuration for pytest.
This file will be automatically recognized by pytest and
applied to all tests using pytest.
"""
import os
import sys
import pytest
from django.conf import settings

# Add the project path to allow imports
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.append(BASE_DIR)

# Import the test settings
from backend.apps.authentication.tests.test_settings import SQLITE_MEMORY_DB

@pytest.fixture(scope='session')
def django_db_setup():
    """
    Database test configuration for pytest.
    This fixture will be used automatically by tests using the database.
    """
    # Use SQLite in-memory for tests
    settings.DATABASES = SQLITE_MEMORY_DB
    
    # Ensure migrations are applied
    from django.core.management import call_command
    call_command('migrate')

# Other useful fixtures for tests
@pytest.fixture
def create_user(db):
    """Fixture to create a test user"""
    from backend.apps.authentication.models import User
    
    def _create_user(username='testuser', email='test@example.com', password='password123', **kwargs):
        return User.objects.create_user(
            username=username,
            email=email,
            password=password,
            **kwargs
        )
    
    return _create_user

@pytest.fixture
def create_coach(db, create_user):
    """Fixture to create a test coach"""
    from backend.apps.authentication.models import CoachProfile
    from decimal import Decimal
    
    def _create_coach(user=None, **kwargs):
        if user is None:
            user = create_user(username='coachuser', email='coach@example.com', is_coach=True)
        
        coach_data = {
            'coaching_languages': 'EN',
            'price_per_hour': Decimal('50.00'),
            'availability': 'Monday to Friday, 9am to 5pm',
            'description': 'Experienced language coach',
        }
        coach_data.update(kwargs)
        
        return CoachProfile.objects.create(user=user, **coach_data)
    
    return _create_coach

@pytest.fixture
def api_client():
    """Fixture to create a test API client"""
    from rest_framework.test import APIClient
    return APIClient()

@pytest.fixture
def authenticated_client(create_user, api_client):
    """Fixture to create an authenticated API client"""
    def _get_authenticated_client(user=None):
        if user is None:
            user = create_user()
        
        api_client.force_authenticate(user=user)
        return api_client
    
    return _get_authenticated_client