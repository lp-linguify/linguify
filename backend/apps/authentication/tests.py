import pytest
from rest_framework.test import APIClient
from rest_framework import status
from .models import User, CoachProfile
from django.urls import reverse
from unittest.mock import patch



#pytest backend/authentication/tests.py

@pytest.mark.django_db
class TestAuth0Views:

    @pytest.mark.parametrize("url_name", ["auth0_login", "auth0_callback"])
    def test_auth0_redirect(self, client, url_name):
        """
        Test that auth0_login and auth0_callback are redirecting correctly
        """
        url = reverse(url_name)
        response = client.get(url)
        assert response.status_code == status.HTTP_302_FOUND
        assert 'location' in response.headers

    @patch('requests.post')
    def test_auth0_callback_success(self, mock_post, client):
        """
        Test that the auth0_callback returns the correct tokens on success
        """
        # Mock the response from the Auth0 token endpoint
        mock_post.return_value.json.return_value = {
            "access_token": "access_token_example",
            "id_token": "id_token_example",
            "expires_in": 3600,
        }

        # Make a GET request to the callback view with a mock code
        url = reverse('auth0_callback') + '?code=test_code'
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "access_token" in response.json()
        assert response.json()["access_token"] == "access_token_example"

    def test_auth0_logout(self, client):
        """
        Test that the logout view redirects to the Auth0 logout URL
        """
        url = reverse('auth0_logout')
        # Simulate an authenticated user
        client.force_authenticate(user=self.superuser)  # You can use a fixture to create a superuser
        response = client.post(url)

        assert response.status_code == status.HTTP_302_FOUND
        assert 'location' in response.headers
        assert "v2/logout" in response.headers['location']

    @patch('requests.get')
    def test_get_auth0_user(self, mock_get, client):
        """
        Test that the get_auth0_user view correctly retrieves user information
        """
        # Mock the response from the Auth0 userinfo endpoint
        mock_get.return_value.json.return_value = {
            "sub": "auth0|1234567890",
            "name": "Test User",
            "email": "testuser@example.com",
        }

        # Simulate an authenticated user
        client.force_authenticate(user=self.superuser)

        # Call the endpoint
        url = reverse('get_auth0_user')
        response = client.get(url, HTTP_AUTHORIZATION="Bearer test_token")

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["name"] == "Test User"
        assert response.json()["email"] == "testuser@example.com"


# @pytest.mark.django_db
# class TestUserAPI:
#     def setup_method(self):
#         self.client = APIClient()
#         self.superuser = User.objects.create_superuser(
#             username="admin",
#             email="admin@example.com",
#             password="adminpass"
#         )
#         self.user = User.objects.create_user(
#             username="testuser",
#             email="testuser@example.com",
#             password="testpass",
#             first_name="Test",
#             last_name="User",
#             age=25
#         )

#     def test_register_user(self):
#         payload = {
#             "username": "newuser",
#             "email": "newuser@example.com",
#             "password": "newpass123",
#             "first_name": "New",
#             "last_name": "User",
#             "age": 30
#         }
#         response = self.client.post("/api/authentication/users/register/", payload)
#         assert response.status_code == status.HTTP_201_CREATED
#         assert response.data["message"] == "User registered successfully."

#     def test_get_user_profile(self):
#         self.client.force_authenticate(user=self.user)
#         response = self.client.get("/api/authentication/users/me/")
#         assert response.status_code == status.HTTP_200_OK
#         assert response.data["email"] == self.user.email

#     def test_deactivate_user(self):
#         self.client.force_authenticate(user=self.superuser)
#         response = self.client.post(f"/api/authentication/users/{self.user.public_id}/deactivate/")
#         assert response.status_code == status.HTTP_200_OK
#         assert response.data["message"] == "User deactivated successfully."
#         self.user.refresh_from_db()
#         assert self.user.is_active is False

#     def test_reactivate_user(self):
#         self.client.force_authenticate(user=self.superuser)
#         self.user.deactivate_user()
#         response = self.client.post(f"/api/authentication/users/{self.user.public_id}/reactivate/")
#         assert response.status_code == status.HTTP_200_OK
#         assert response.data["message"] == "User reactivated successfully."
#         self.user.refresh_from_db()
#         assert self.user.is_active is True

#     def test_get_users_as_superuser(self):
#         self.client.force_authenticate(user=self.superuser)
#         response = self.client.get("/api/authentication/users/")
#         assert response.status_code == status.HTTP_200_OK
#         assert len(response.data) >= 2

#     def test_get_users_as_regular_user(self):
#         self.client.force_authenticate(user=self.user)
#         response = self.client.get("/api/authentication/users/")
#         assert response.status_code == status.HTTP_200_OK
#         assert not any(user["is_superuser"] for user in response.data)


# @pytest.mark.django_db
# class TestCoachProfileAPI:
#     def setup_method(self):
#         self.client = APIClient()
#         self.user = User.objects.create_user(
#             username="coachuser",
#             email="coach@example.com",
#             password="coachpass",
#             first_name="Coach",
#             last_name="User",
#             is_coach=True
#         )
#         self.coach_profile = CoachProfile.objects.create(
#             user=self.user,
#             coaching_languages="EN",
#             price_per_hour=50.00,
#             availability="Monday to Friday",
#             description="Experienced English coach."
#         )

#     def test_get_coach_profiles(self):
#         response = self.client.get("/api/authentication/coaches/")
#         assert response.status_code == status.HTTP_200_OK
#         assert len(response.data) >= 1

#     def test_update_availability(self):
#         self.client.force_authenticate(user=self.user)
#         payload = {"availability": "Weekends only"}
#         response = self.client.patch(f"/api/authentication/coaches/{self.coach_profile.id}/update_availability/", payload)
#         assert response.status_code == status.HTTP_200_OK
#         assert response.data["message"] == "Availability updated successfully."
#         self.coach_profile.refresh_from_db()
#         assert self.coach_profile.availability == "Weekends only"

#     def test_update_price(self):
#         self.client.force_authenticate(user=self.user)
#         payload = {"price_per_hour": 75.00}
#         response = self.client.patch(f"/api/authentication/coaches/{self.coach_profile.id}/update_price/", payload)
#         assert response.status_code == status.HTTP_200_OK
#         assert response.data["message"] == "Price updated successfully."
#         self.coach_profile.refresh_from_db()
#         assert self.coach_profile.price_per_hour == 75.00
