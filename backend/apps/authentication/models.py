# backend/authentication/models.py
import uuid
from django.db import models  # Ensure this is imported correctly
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.exceptions import ObjectDoesNotExist
from django.http import Http404
from decimal import Decimal

LANGUAGE_CHOICES = [
    ('EN', 'English'),
    ('FR', 'French'),
    ('NL', 'Dutch'),
    ('DE', 'German'),
    ('ES', 'Spanish'),
    ('IT', 'Italian'),
    ('PT', 'Portuguese'),
]

LEVEL_CHOICES = [
    ('A1', 'A1'),
    ('A2', 'A2'),
    ('B1', 'B1'),
    ('B2', 'B2'),
    ('C1', 'C1'),
    ('C2', 'C2'),
]

OBJECTIVES_CHOICES = [
    ('Travel', 'Travel'),
    ('Business', 'Business'),
    ('Live Abroad', 'Live Abroad'),
    ('Exam', 'Exam'),
    ('For Fun', 'For Fun'),
    ('Work', 'Work'),
    ('School', 'School'),
    ('Study', 'Study'),
    ('Personal', 'Personal'),
]

GENDER_CHOICES = [
    ('M', 'Male'),
    ('F', 'Female'),
]


class UserManager(BaseUserManager):
    def get_object_by_public_id(self, public_id):
        try:
            instance = self.get(public_id=public_id)
            return instance
        except (ObjectDoesNotExist, ValueError, TypeError):
            raise Http404

    def create_user(self, username, email, password=None, **kwargs):
        """Create and return a `User` with an email, phone number, username, and password."""
        if username is None:
            raise TypeError('Users must have a username.')
        if email is None:
            raise TypeError('Users must have an email.')
        if password is None:
            raise TypeError('Users must have a password.')

        user = self.model(username=username, email=self.normalize_email(email), **kwargs)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password, **kwargs):
        """Create and return a `User` with superuser (admin) permissions."""
        if username is None:
            raise TypeError('Superusers must have a username.')
        if email is None:
            raise TypeError('Superusers must have an email.')
        if password is None:
            raise TypeError('Superusers must have a password.')

        user = self.create_user(username, email, password, **kwargs)
        user.is_superuser = True
        user.is_staff = True
        user.save(using=self._db)

        return user

    def get_all_coaches(self):
        """
        Retrieve all active users who are coaches.

        Returns:
            QuerySet: A QuerySet containing all active users with the `is_coach` flag set to True.
        """
        return self.filter(is_coach=True, is_active=True)

    def search_by_email(self, email):

        """
        Search for users by email.

        Args:
            email (str): The email to search for.

        Returns:
            QuerySet: A QuerySet containing users whose email contains the given email string.
        """
        return self.filter(email__icontains=email)

    def search_by_username(self, username):

        """
        Search for users by username.

        Args:
            username (str): The username to search for.

        Returns:
            QuerySet: A QuerySet containing users whose username contains the given username string.
        """
        return self.filter(username__icontains=username)

    def search_by_name(self, name):

        """
        Search for users by first or last name.

        Args:
            name (str): The name to search for.

        Returns:
            QuerySet: A QuerySet containing users whose first or last name contains the given name string.
        """
        return self.filter(first_name__icontains=name)

    def search_by_language(self, language):

        """
        Search for users by native or target language.

        Args:
            language (str): The language to search for.

        Returns:
            QuerySet: A QuerySet containing users whose native or target language matches the given language string.
        """
        return self.filter(native_language=language)

    def search_by_level(self, level):

        """
        Search for users by language level.

        Args:
            level (str): The language level to search for.

        Returns:
            QuerySet: A QuerySet containing users whose language level matches the given level string.
        """
        return self.filter(language_level=level)


# Base User Model
class User(AbstractBaseUser, PermissionsMixin):
    public_id = models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True)
    username = models.CharField(db_index=True, max_length=255, unique=True)
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    email = models.EmailField(db_index=True, unique=True)
    birthday = models.DateField(null=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, null=True, blank=True)
    # in order to know if the user is active or not; if the user is not active, he/she can't log in to the platform
    # the user can be deactivated by the admin or by the user himself
    # the user progress will be saved even if the user is deactivated during a certain period of time (e.g. 6 months)
    # if the user is deactivated for more than 6 months, the user progress will be deleted
    is_active = models.BooleanField(null=False, default=1)
    is_subscribed = models.BooleanField(null=False, default=0)
    is_superuser = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now=True)
    updated_at = models.DateTimeField(auto_now_add=True)
    # Common fields for all users
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    bio = models.TextField(max_length=500, null=True, blank=True)
    native_language = models.CharField(max_length=20, choices=LANGUAGE_CHOICES, default=LANGUAGE_CHOICES[0][0],
                                       help_text="Your native language")
    # Fields for language learners
    target_language = models.CharField(max_length=20, choices=LANGUAGE_CHOICES, default=LANGUAGE_CHOICES[0][0],
                                      help_text="The language you want to learn")
    language_level = models.CharField(max_length=2, choices=LEVEL_CHOICES, default=LEVEL_CHOICES[0][0],
                                      help_text="Your language level")
    objectives = models.CharField(max_length=20, choices=OBJECTIVES_CHOICES, default=OBJECTIVES_CHOICES[0][0],
                                  help_text="Your learning objectives")
    is_coach = models.BooleanField(default=False)
    interface_language = models.CharField(max_length=10, default='en')
    theme = models.CharField(max_length=10, default='light')
    # settings fields
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    weekday_reminders = models.BooleanField(default=True)
    weekend_reminders = models.BooleanField(default=False)
    reminder_time = models.CharField(max_length=5, default='18:00')
    # learning settings fields
    speaking_exercises = models.BooleanField(default=True)
    listening_exercises = models.BooleanField(default=True)
    reading_exercises = models.BooleanField(default=True)
    writing_exercises = models.BooleanField(default=True)
    daily_goal = models.IntegerField(default=15)

    # Private settings fields
    public_profile = models.BooleanField(default=True)
    share_progress = models.BooleanField(default=True)
    share_activity = models.BooleanField(default=False)



    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    objects = UserManager()

    def update_profile(self, **kwargs):
        for k, v in kwargs.items():
            if hasattr(self, k):
                setattr(self, k, v)
        self.save()

    def deactivate_user(self):
        self.is_active = False
        self.save()

    def reactivate_user(self):
        self.is_active = True
        self.save()

    def __str__(self):
        return f"{self.email}"

    @property
    def name(self):
        return f"{self.first_name} {self.last_name}"

# Extended Coach Profile Model: the additional fields for a coach profile are added here as a separate model.
# This model has a Many-to-many relationship with the User model.
# this means that a user can have multiple coach profiles and a coach profile can be associated with multiple users.
# the coach profile is prepared in view to develop the coaching app in the future.


class CoachProfile(models.Model):
    """
    Model representing a coach's profile.

    Attributes:
        user (User): One-to-one relationship with the User model.
        coaching_languages (str): Languages the coach can teach, chosen from predefined choices.
        price_per_hour (Decimal): Hourly rate for coaching sessions.
        availability (str): Text field describing the coach's availability.
        description (str): Detailed description of the coach's profile.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='coach_profile')
    coaching_languages = models.CharField(max_length=20, choices=LANGUAGE_CHOICES, default=LANGUAGE_CHOICES[0][0])
    price_per_hour = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    availability = models.TextField(null=True, blank=True)
    description = models.TextField(max_length=1000, null=True, blank=True)
    bio = models.TextField(max_length=500, null=True, blank=True)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('5.00'), help_text="Commission rate taken by Linguify (in %).")
    commission_override = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Override the default commission rate.")

    # to update the availability of the coach
    def update_availability(self, new_availability):
        self.availability = new_availability
        self.save()

    # to update the price per hour of the coach
    def update_price_per_hour(self, new_price):
        self.price_per_hour = new_price
        self.save()

    def calculate_commission(self):
        commission_to_use = self.commission_override if self.commission_override is not None else self.commission_rate
        return (self.price_per_hour * commission_to_use) / Decimal('100.00')

    def __str__(self):
        """
        String representation of the CoachProfile model.

        Returns:
            str: A string representing the coach's profile.
        """
        return f"Coach Profile of {self.user.username}"

# Review Model lol
class Review(models.Model):
    """
    Model representing a review.

    Attributes:
        reviewer (User): Foreign key to the User model, representing the user who wrote the review.
        rating (Decimal): Rating given by the reviewer, with a maximum of 3 digits and 2 decimal places.
        comment (str): Optional text content of the review.
        review_date (datetime): Date and time when the review was created.
    """
    coach = models.ForeignKey(CoachProfile, on_delete=models.CASCADE, related_name='reviews', default=None)
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_reviews')
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    comment = models.TextField(max_length=500, null=True, blank=True)
    review_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        """
        String representation of the Review model.

        Returns:
            str: A string representing the reviewer's username.
        """
        return f"Review by {self.reviewer.username}"

class UserFeedback(models.Model):
    """
    Model representing user feedback to get a little bit of feedback don't u think?.

    Attributes:
        user (User): Foreign key to the User model, representing the user who gave the feedback.
        feedback_type (str): Type of feedback, either 'like' or 'dislike'.
        feedback_content (str): Optional text content of the feedback.
        feedback_date (datetime): Date and time when the feedback was created.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feedbacks')
    feedback_type = models.CharField(max_length=10, choices=[('like', 'Like'), ('dislike', 'Dislike')], default='like')
    feedback_content = models.TextField(null=True, blank=True)
    feedback_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        """
        String representation of the UserFeedback model.

        Returns:
            str: A string representing the user's username and the feedback type.
        """
        return f"{self.user.username} - {self.feedback_type}"
