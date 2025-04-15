# authentication/tests/test_models_pytest.py
"""
Tests pour les modèles utilisant pytest au lieu de unittest.
Ces tests montrent comment utiliser pytest avec Django et les fixtures définies dans conftest.py.
"""
import pytest
import datetime
from decimal import Decimal
from django.db import IntegrityError
from ..models import User, CoachProfile, Review, UserFeedback

# Tests pour le modèle User
@pytest.mark.django_db
class TestUserModel:
    def test_user_creation(self, create_user):
        """Test que l'utilisateur est correctement créé"""
        user = create_user(
            first_name='Test',
            last_name='User',
            native_language='FR',
            target_language='EN',
            language_level='B1',
            objectives='Travel'
        )
        
        assert user.username == 'testuser'
        assert user.email == 'test@example.com'
        assert user.first_name == 'Test'
        assert user.last_name == 'User'
        assert user.native_language == 'FR'
        assert user.target_language == 'EN'
        assert user.language_level == 'B1'
        assert user.objectives == 'Travel'
        assert user.is_active is True
        assert user.is_staff is False
        assert user.is_superuser is False
    
    def test_create_superuser(self):
        """Test la création d'un superutilisateur"""
        admin = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass'
        )
        
        assert admin.is_active is True
        assert admin.is_staff is True
        assert admin.is_superuser is True
    
    def test_user_str_representation(self, create_user):
        """Test la représentation en chaîne d'un utilisateur"""
        user = create_user()
        assert str(user) == 'test@example.com'
    
    def test_name_property(self, create_user):
        """Test la propriété 'name'"""
        user = create_user(first_name='Test', last_name='User')
        assert user.name == 'Test User'
    
    def test_age_property(self, create_user):
        """Test la propriété 'age'"""
        user = create_user()
        
        # Sans date de naissance
        assert user.age is None
        
        # Avec date de naissance (environ 30 ans)
        birthday = datetime.date.today() - datetime.timedelta(days=365*30)
        user.birthday = birthday
        user.save()
        
        # Vérifier que l'âge est environ 30 ans (avec une marge d'erreur de 1 an)
        assert abs(user.age - 30) <= 1
    
    def test_update_profile(self, create_user):
        """Test la méthode update_profile"""
        user = create_user(first_name='Original', last_name='Name')
        
        user.update_profile(
            first_name='Updated',
            last_name='Profile',
            objectives='Business'
        )
        
        # Rafraîchir l'utilisateur depuis la base de données
        user.refresh_from_db()
        
        assert user.first_name == 'Updated'
        assert user.last_name == 'Profile'
        assert user.objectives == 'Business'
    
    def test_deactivate_and_reactivate_user(self, create_user):
        """Test les méthodes deactivate_user et reactivate_user"""
        user = create_user()
        
        # Tester la désactivation
        user.deactivate_user()
        assert user.is_active is False
        
        # Tester la réactivation
        user.reactivate_user()
        assert user.is_active is True
    
    def test_unique_constraints(self, create_user):
        """Test les contraintes d'unicité"""
        create_user()  # Crée l'utilisateur par défaut
        
        # Tester l'unicité de l'email
        with pytest.raises(IntegrityError):
            User.objects.create_user(
                username='anotheruser',
                email='test@example.com',  # Email déjà utilisé
                password='password123'
            )
        
        # Tester l'unicité du nom d'utilisateur
        with pytest.raises(IntegrityError):
            User.objects.create_user(
                username='testuser',  # Nom d'utilisateur déjà utilisé
                email='another@example.com',
                password='password123'
            )

# Tests pour le modèle CoachProfile
@pytest.mark.django_db
class TestCoachProfileModel:
    def test_coach_profile_creation(self, create_coach):
        """Test que le profil de coach est correctement créé"""
        coach_profile = create_coach()
        
        assert coach_profile.coaching_languages == 'EN'
        assert coach_profile.price_per_hour == Decimal('50.00')
        assert coach_profile.availability == 'Monday to Friday, 9am to 5pm'
        assert coach_profile.description == 'Experienced language coach'
        assert coach_profile.commission_rate == Decimal('5.00')
        assert coach_profile.commission_override is None
    
    def test_coach_profile_str_representation(self, create_coach):
        """Test la représentation en chaîne d'un profil de coach"""
        coach_profile = create_coach()
        assert str(coach_profile) == 'Coach Profile of coachuser'
    
    def test_update_availability(self, create_coach):
        """Test la méthode update_availability"""
        coach_profile = create_coach()
        
        new_availability = 'Weekends only'
        coach_profile.update_availability(new_availability)
        
        # Rafraîchir le profil depuis la base de données
        coach_profile.refresh_from_db()
        
        assert coach_profile.availability == new_availability
    
    def test_update_price_per_hour(self, create_coach):
        """Test la méthode update_price_per_hour"""
        coach_profile = create_coach()
        
        new_price = Decimal('60.00')
        coach_profile.update_price_per_hour(new_price)
        
        # Rafraîchir le profil depuis la base de données
        coach_profile.refresh_from_db()
        
        assert coach_profile.price_per_hour == new_price
    
    def test_calculate_commission(self, create_coach):
        """Test la méthode calculate_commission"""
        coach_profile = create_coach()
        
        # Avec le taux de commission par défaut
        expected_commission = Decimal('2.50')  # 5% de 50.00
        assert coach_profile.calculate_commission() == expected_commission
        
        # Avec un taux de commission personnalisé
        coach_profile.commission_override = Decimal('10.00')
        coach_profile.save()
        
        expected_commission = Decimal('5.00')  # 10% de 50.00
        assert coach_profile.calculate_commission() == expected_commission

# Tests pour le modèle Review
@pytest.mark.django_db
class TestReviewModel:
    def test_review_creation(self, create_user, create_coach):
        """Test que l'avis est correctement créé"""
        coach_profile = create_coach()
        reviewer = create_user(username='reviewer', email='reviewer@example.com')
        
        review = Review.objects.create(
            coach=coach_profile,
            reviewer=reviewer,
            rating=Decimal('4.50'),
            comment='Great teaching skills and methodology'
        )
        
        assert review.coach == coach_profile
        assert review.reviewer == reviewer
        assert review.rating == Decimal('4.50')
        assert review.comment == 'Great teaching skills and methodology'
        assert review.review_date is not None
    
    def test_review_str_representation(self, create_user, create_coach):
        """Test la représentation en chaîne d'un avis"""
        coach_profile = create_coach()
        reviewer = create_user(username='reviewer', email='reviewer@example.com')
        
        review = Review.objects.create(
            coach=coach_profile,
            reviewer=reviewer,
            rating=Decimal('4.50')
        )
        
        assert str(review) == 'Review by reviewer'
    
    def test_relationship_with_coach_and_reviewer(self, create_user, create_coach):
        """Test les relations avec le coach et le reviewer"""
        coach_profile = create_coach()
        reviewer = create_user(username='reviewer', email='reviewer@example.com')
        
        review = Review.objects.create(
            coach=coach_profile,
            reviewer=reviewer,
            rating=Decimal('4.50')
        )
        
        # Vérifier que l'avis est accessible depuis le profil de coach
        assert coach_profile.reviews.count() == 1
        assert coach_profile.reviews.first() == review
        
        # Vérifier que l'avis est accessible depuis le reviewer
        assert reviewer.given_reviews.count() == 1
        assert reviewer.given_reviews.first() == review

# Tests pour le modèle UserFeedback
@pytest.mark.django_db
class TestUserFeedbackModel:
    def test_feedback_creation(self, create_user):
        """Test que le feedback est correctement créé"""
        user = create_user(username='feedbackuser', email='feedback@example.com')
        
        feedback = UserFeedback.objects.create(
            user=user,
            feedback_type='like',
            feedback_content='Great platform for language learning'
        )
        
        assert feedback.user == user
        assert feedback.feedback_type == 'like'
        assert feedback.feedback_content == 'Great platform for language learning'
        assert feedback.feedback_date is not None
    
    def test_feedback_str_representation(self, create_user):
        """Test la représentation en chaîne d'un feedback"""
        user = create_user(username='feedbackuser', email='feedback@example.com')
        
        feedback = UserFeedback.objects.create(
            user=user,
            feedback_type='like'
        )
        
        assert str(feedback) == 'feedbackuser - like'
    
    def test_relationship_with_user(self, create_user):
        """Test la relation avec l'utilisateur"""
        user = create_user(username='feedbackuser', email='feedback@example.com')
        
        # Créer un premier feedback
        feedback1 = UserFeedback.objects.create(
            user=user,
            feedback_type='like',
            feedback_content='Great platform for language learning'
        )
        
        # Vérifier que le feedback est accessible depuis l'utilisateur
        assert user.feedbacks.count() == 1
        assert user.feedbacks.first() == feedback1
        
        # Créer un second feedback pour le même utilisateur
        feedback2 = UserFeedback.objects.create(
            user=user,
            feedback_type='dislike',
            feedback_content='Could use more practice exercises'
        )
        
        # Vérifier que les deux feedbacks sont accessibles
        assert user.feedbacks.count() == 2
        assert feedback2 in user.feedbacks.all()