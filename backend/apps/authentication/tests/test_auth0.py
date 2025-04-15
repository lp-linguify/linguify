# authentication/tests/test_auth0.py
from django.test import TestCase, RequestFactory, override_settings, SimpleTestCase
from django.conf import settings
from django.urls import reverse
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from unittest.mock import patch, Mock, MagicMock
import json
import jwt
from urllib.parse import urlencode
from backend.apps.authentication.views import Auth0Login, auth0_callback, auth0_logout, user_profile, get_me_view
from backend.apps.authentication.models import User


class Auth0LoginTests(SimpleTestCase):
    """Tests pour la vue Auth0Login qui initialise le processus d'authentification"""
    
    def setUp(self):
        self.factory = RequestFactory()
        self.view = Auth0Login.as_view()
        
    @override_settings(
        AUTH0_CLIENT_ID='ctNt07qaUrHRnWtHkXoA7QFd3jodpXNu',
        AUTH0_DOMAIN='dev-7qe275o831ebkhbj.eu.auth0.com',
        FRONTEND_CALLBACK_URL='http://localhost:3000/callback',
        FRONTEND_URL='http://localhost:3000',
        AUTH0_AUDIENCE='https://linguify-api'
    )
    def test_auth0_login_generates_correct_url(self):
        """Test que la vue génère l'URL d'authentification Auth0 correcte"""
        request = self.factory.get('/api/auth/login/')
        response = self.view(request)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('auth_url', response.data)
        
        # Vérifier que l'URL contient tous les paramètres requis
        auth_url = response.data['auth_url']
        self.assertIn('https://dev-7qe275o831ebkhbj.eu.auth0.com/authorize?', auth_url)
        self.assertIn('client_id=ctNt07qaUrHRnWtHkXoA7QFd3jodpXNu', auth_url)
        self.assertIn('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback', auth_url)
        self.assertIn('response_type=code', auth_url)
        self.assertIn('scope=openid+profile+email', auth_url)
        self.assertIn('audience=https%3A%2F%2Flinguify-api', auth_url)
        
        # Vérifier les en-têtes CORS
        self.assertEqual(response['Access-Control-Allow-Origin'], 'http://localhost:3000')
        self.assertEqual(response['Access-Control-Allow-Credentials'], 'true')
        
    @override_settings(
        AUTH0_CLIENT_ID='ctNt07qaUrHRnWtHkXoA7QFd3jodpXNu',
        AUTH0_DOMAIN='dev-7qe275o831ebkhbj.eu.auth0.com',
        FRONTEND_CALLBACK_URL='http://localhost:3000/callback',
        FRONTEND_URL='http://localhost:3000',
        AUTH0_AUDIENCE='https://linguify-api'
    )
    def test_auth0_login_handles_exceptions(self):
        """Test que la vue gère correctement les exceptions"""
        request = self.factory.get('/api/auth/login/')
        
        with patch('backend.apps.authentication.views.urlencode', side_effect=Exception('Test error')):
            response = self.view(request)
            
            self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
            self.assertIn('error', response.data)
            self.assertEqual(response.data['error'], 'Authentication service unavailable')
            self.assertEqual(response.data['details'], 'Test error')


class Auth0CallbackTests(SimpleTestCase):
    """Tests pour la fonction de callback Auth0"""
    
    def setUp(self):
        self.factory = RequestFactory()
        
    @patch('backend.apps.authentication.views.requests.post')
    @override_settings(
        AUTH0_CLIENT_ID='ctNt07qaUrHRnWtHkXoA7QFd3jodpXNu',
        AUTH0_CLIENT_SECRET='IfdLQfxjTpLviHxUWwfjvoUBW7kcmJ9_y0IDy3ASoDnqy0diI9MEaiqej7JUKecG',
        AUTH0_DOMAIN='dev-7qe275o831ebkhbj.eu.auth0.com',
        FRONTEND_URL='http://localhost:3000'
    )
    def test_auth0_callback_success(self, mock_post):
        """Test que le callback traite correctement un code d'autorisation valide"""
        # Configurer la réponse simulée
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'access_token': 'test-access-token',
            'expires_in': 86400,
            'id_token': 'test-id-token'
        }
        mock_response.text = json.dumps(mock_response.json.return_value)
        mock_post.return_value = mock_response
        
        # Créer la requête
        request = self.factory.get('/api/auth/callback/?code=test-auth-code')
        response = auth0_callback(request)
        
        # Vérifier la réponse
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = json.loads(response.content)
        self.assertEqual(response_data['access_token'], 'test-access-token')
        self.assertEqual(response_data['expires_in'], 86400)
        
        # Vérifier que la requête HTTP a été correctement formée
        mock_post.assert_called_once_with(
            'https://dev-7qe275o831ebkhbj.eu.auth0.com/oauth/token',
            data={
                'grant_type': 'authorization_code',
                'client_id': 'ctNt07qaUrHRnWtHkXoA7QFd3jodpXNu',
                'client_secret': 'IfdLQfxjTpLviHxUWwfjvoUBW7kcmJ9_y0IDy3ASoDnqy0diI9MEaiqej7JUKecG',
                'code': 'test-auth-code',
                'redirect_uri': 'http://localhost:3000/callback'
            },
            timeout=10
        )
        
    def test_auth0_callback_no_code(self):
        """Test que le callback gère correctement l'absence de code d'autorisation"""
        request = self.factory.get('/api/auth/callback/')
        response = auth0_callback(request)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response_data = json.loads(response.content)
        self.assertEqual(response_data['error'], 'Authorization code missing')
        
    @patch('backend.apps.authentication.views.requests.post')
    @override_settings(
        AUTH0_CLIENT_ID='ctNt07qaUrHRnWtHkXoA7QFd3jodpXNu',
        AUTH0_CLIENT_SECRET='IfdLQfxjTpLviHxUWwfjvoUBW7kcmJ9_y0IDy3ASoDnqy0diI9MEaiqej7JUKecG',
        AUTH0_DOMAIN='dev-7qe275o831ebkhbj.eu.auth0.com',
        FRONTEND_URL='http://localhost:3000'
    )
    def test_auth0_callback_token_error(self, mock_post):
        """Test que le callback gère correctement un échec d'obtention de token"""
        # Configurer la réponse simulée avec une erreur
        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.text = json.dumps({'error': 'invalid_grant'})
        mock_post.return_value = mock_response
        
        # Créer la requête
        request = self.factory.get('/api/auth/callback/?code=invalid-code')
        response = auth0_callback(request)
        
        # Vérifier la réponse
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        response_data = json.loads(response.content)
        self.assertEqual(response_data['error'], 'Failed to obtain token')


# Tests nécessitant une base de données - à exécuter une fois les migrations appliquées
class AuthWithDatabaseTests:
    """
    Collection de tests qui nécessitent une base de données.
    Note: Ne pas exécuter ces tests tant que les migrations n'ont pas été appliquées.
    """
    
    class Auth0LogoutTests(APITestCase):
        """Tests pour la fonction de déconnexion Auth0"""
        
        def setUp(self):
            # Créer un utilisateur de test
            self.user = User.objects.create_user(
                username='testuser',
                email='test@example.com',
                password='password123'
            )
            self.client = APIClient()
            self.client.force_authenticate(user=self.user)
            
        @override_settings(
            AUTH0_CLIENT_ID='ctNt07qaUrHRnWtHkXoA7QFd3jodpXNu',
            AUTH0_DOMAIN='dev-7qe275o831ebkhbj.eu.auth0.com',
            FRONTEND_LOGOUT_REDIRECT='http://localhost:3000'
        )
        def test_auth0_logout_success(self):
            """Test que la déconnexion renvoie l'URL de déconnexion correcte"""
            response = self.client.post('/api/auth/logout/')
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            response_data = response.json()
            
            # Vérifier l'URL de déconnexion
            self.assertIn('logout_url', response_data)
            logout_url = response_data['logout_url']
            self.assertIn('https://dev-7qe275o831ebkhbj.eu.auth0.com/v2/logout?', logout_url)
            self.assertIn('client_id=ctNt07qaUrHRnWtHkXoA7QFd3jodpXNu', logout_url)
            self.assertIn('returnTo=http%3A%2F%2Flocalhost%3A3000', logout_url)
            
        def test_auth0_logout_unauthenticated(self):
            """Test que la déconnexion n'est pas accessible pour les utilisateurs non authentifiés"""
            # Déconnecter l'utilisateur
            self.client.force_authenticate(user=None)
            
            response = self.client.post('/api/auth/logout/')
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


    class UserProfileTests(APITestCase):
        """Tests pour la gestion des profils utilisateurs"""
        
        def setUp(self):
            # Créer un utilisateur de test
            self.user = User.objects.create_user(
                username='testuser',
                email='test@example.com',
                password='password123',
                first_name='Test',
                last_name='User',
                native_language='fr',
                target_language='en'
            )
            self.client = APIClient()
            self.client.force_authenticate(user=self.user)
            
        def test_get_user_profile(self):
            """Test l'obtention du profil utilisateur"""
            response = self.client.get('/api/auth/profile/')
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            # Vérifier que les informations de base sont présentes
            self.assertEqual(response.data['email'], 'test@example.com')
            
        def test_update_user_profile(self):
            """Test la mise à jour du profil utilisateur"""
            update_data = {
                'first_name': 'Updated',
                'last_name': 'Name',
                'bio': 'This is my test bio',
                'target_language': 'es'
            }
            
            response = self.client.patch(
                '/api/auth/profile/',
                update_data,
                format='json'
            )
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            # Rafraîchir l'utilisateur depuis la base de données
            self.user.refresh_from_db()
            
            # Vérifier que les données ont été mises à jour
            self.assertEqual(self.user.first_name, 'Updated')
            self.assertEqual(self.user.last_name, 'Name')
            self.assertEqual(self.user.bio, 'This is my test bio')
            self.assertEqual(self.user.target_language, 'es')
            
        def test_get_profile_unauthenticated(self):
            """Test que le profil n'est pas accessible aux utilisateurs non authentifiés"""
            self.client.force_authenticate(user=None)
            response = self.client.get('/api/auth/profile/')
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


    class GetMeViewTests(APITestCase):
        """Tests pour la vue get_me_view"""
        
        def setUp(self):
            # Créer un utilisateur de test
            self.user = User.objects.create_user(
                username='testuser',
                email='test@example.com',
                password='password123',
                first_name='Test',
                last_name='User',
                native_language='fr',
                target_language='en',
                is_coach=True
            )
            
            self.client = APIClient()
            self.client.force_authenticate(user=self.user)
            
        def test_get_me_success(self):
            """Test que la vue get_me_view renvoie correctement les informations de l'utilisateur"""
            response = self.client.get('/api/auth/me/')
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            # Vérifier les données de base
            self.assertEqual(response.data['id'], str(self.user.id))
            self.assertEqual(response.data['email'], 'test@example.com')
            self.assertEqual(response.data['username'], 'testuser')
            self.assertEqual(response.data['first_name'], 'Test')
            self.assertEqual(response.data['last_name'], 'User')
            self.assertEqual(response.data['name'], 'Test User')
            self.assertEqual(response.data['native_language'], 'fr')
            self.assertEqual(response.data['target_language'], 'en')
            self.assertEqual(response.data['is_coach'], True)
            
        def test_get_me_unauthenticated(self):
            """Test que la vue n'est pas accessible aux utilisateurs non authentifiés"""
            self.client.force_authenticate(user=None)
            response = self.client.get('/api/auth/me/')
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)