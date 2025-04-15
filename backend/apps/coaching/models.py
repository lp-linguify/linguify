from django.db import models
from authentication.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from decimal import Decimal
from datetime import datetime, timedelta

class Language(models.Model):
    LANGUAGE_CHOICES = [
        ('EN', 'English'),
        ('FR', 'French'),
        ('ES', 'Spanish'),
        ('DE', 'German'),
        ('IT', 'Italian'),
        ('PT', 'Portuguese'),
        ('NL', 'Dutch'),
        ('RU', 'Russian'),
        ('ZH', 'Chinese'),
        ('JA', 'Japanese'),
        ('KO', 'Korean'),
        ('AR', 'Arabic'),
        ('HI', 'Hindi'),
    ]
    
    name = models.CharField(max_length=50)
    code = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, unique=True)
    is_active = models.BooleanField(default=True)
    icon = models.ImageField(upload_to='language_icons/', null=True, blank=True)
    
    def __str__(self):
        return self.name

class Coach(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField()
    profile_photo = models.ImageField(upload_to='coach_photos/', null=True, blank=True)
    video_introduction = models.URLField(null=True, blank=True)
    hourly_rate = models.DecimalField(
        max_digits=6, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('5.00'))]  # Taux minimum
    )
    languages = models.ManyToManyField(Language, through='CoachLanguage')
    specialties = models.ManyToManyField('TeachingSpecialty')
    is_verified = models.BooleanField(default=False)
    commission_rate = models.DecimalField(
        max_digits=4, 
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=15.00
    )
    average_rating = models.DecimalField(
        max_digits=3, 
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        default=0
    )
    total_lessons = models.IntegerField(default=0)
    response_time = models.DurationField(default=timedelta(hours=24))
    is_featured = models.BooleanField(default=False)
    bank_info = models.JSONField(null=True, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['average_rating', 'total_lessons']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} - Coach"

class TeachingSpecialty(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    
    class Meta:
        verbose_name_plural = "Teaching Specialties"
    
    def __str__(self):
        return self.name

class CoachLanguage(models.Model):
    coach = models.ForeignKey(Coach, on_delete=models.CASCADE)
    language = models.ForeignKey(Language, on_delete=models.CASCADE)
    proficiency_level = models.CharField(
        max_length=2,
        choices=[
            ('A1', 'Débutant'),
            ('A2', 'Élémentaire'),
            ('B1', 'Intermédiaire'),
            ('B2', 'Intermédiaire supérieur'),
            ('C1', 'Avancé'),
            ('C2', 'Maîtrise'),
            ('NT', 'Langue maternelle')
        ]
    )
    teaching_certificate = models.FileField(
        upload_to='certificates/', 
        null=True, 
        blank=True
    )
    years_experience = models.PositiveIntegerField(default=0)
    
    class Meta:
        unique_together = ['coach', 'language']

class Booking(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='student_bookings')
    coach = models.ForeignKey(Coach, on_delete=models.CASCADE, related_name='coach_bookings')
    language = models.ForeignKey(Language, on_delete=models.CASCADE)
    date = models.DateField()
    start_time = models.TimeField()
    duration = models.IntegerField(
        help_text="Durée en minutes",
        validators=[MinValueValidator(30), MaxValueValidator(180)]
    )
    
    STATUS_CHOICES = [
        ('PENDING', 'En attente'),
        ('CONFIRMED', 'Confirmé'),
        ('IN_PROGRESS', 'En cours'),
        ('COMPLETED', 'Terminé'),
        ('CANCELLED', 'Annulé'),
        ('REFUNDED', 'Remboursé'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2)
    coach_payout = models.DecimalField(max_digits=10, decimal_places=2)
    
    meeting_link = models.URLField(null=True, blank=True)
    lesson_objectives = models.TextField(null=True, blank=True)
    materials = models.FileField(upload_to='lesson_materials/', null=True, blank=True)
    
    cancellation_reason = models.TextField(null=True, blank=True)
    cancellation_time = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def clean(self):
        # Vérifier la disponibilité du coach
        if not self._is_coach_available():
            raise ValidationError("Le coach n'est pas disponible à cette période")
        
        # Vérifier que la réservation est dans le futur
        if self.date < datetime.now().date():
            raise ValidationError("La date de réservation doit être dans le futur")
        
        # Vérifier que le coach enseigne bien cette langue
        if not self.coach.languages.filter(id=self.language.id).exists():
            raise ValidationError("Ce coach n'enseigne pas cette langue")
    
    def _is_coach_available(self):
        # Logique pour vérifier la disponibilité du coach
        day_of_week = self.date.weekday()
        booking_end_time = (datetime.combine(self.date, self.start_time) + 
                          timedelta(minutes=self.duration)).time()
        
        # Vérifier les disponibilités du coach
        availability = Availability.objects.filter(
            coach=self.coach,
            day_of_week=day_of_week,
            start_time__lte=self.start_time,
            end_time__gte=booking_end_time
        ).exists()
        
        if not availability:
            return False
        
        # Vérifier s'il n'y a pas d'autres réservations qui se chevauchent
        overlapping_bookings = Booking.objects.filter(
            coach=self.coach,
            date=self.date,
            status__in=['PENDING', 'CONFIRMED', 'IN_PROGRESS']
        ).exclude(id=self.id)
        
        for booking in overlapping_bookings:
            booking_end = (datetime.combine(booking.date, booking.start_time) + 
                         timedelta(minutes=booking.duration)).time()
            if (self.start_time < booking_end and 
                booking_end_time > booking.start_time):
                return False
        
        return True
    
    def save(self, *args, **kwargs):
        if not self.pk:  # Nouveau booking
            hourly_rate = self.coach.hourly_rate
            hours = Decimal(self.duration) / Decimal(60)
            self.total_amount = hourly_rate * hours
            self.commission_amount = self.total_amount * (self.coach.commission_rate / Decimal(100))
            self.coach_payout = self.total_amount - self.commission_amount
        
        self.full_clean()
        super().save(*args, **kwargs)
        
        if self.status == 'COMPLETED':
            self.coach.total_lessons += 1
            self.coach.save()

class Review(models.Model):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE)
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField()
    teaching_quality = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    communication = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    punctuality = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_published = models.BooleanField(default=True)
    
    def clean(self):
        if self.booking.status != 'COMPLETED':
            raise ValidationError("Vous ne pouvez évaluer que les leçons terminées")
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
        if self.is_published:
            # Mettre à jour la moyenne des notes du coach
            coach = self.booking.coach
            reviews = Review.objects.filter(
                booking__coach=coach,
                is_published=True
            )
            coach.average_rating = Decimal(sum(r.rating for r in reviews)) / reviews.count()
            coach.save()

class Availability(models.Model):
    coach = models.ForeignKey(Coach, on_delete=models.CASCADE)
    day_of_week = models.IntegerField(
        choices=[
            (0, 'Lundi'),
            (1, 'Mardi'),
            (2, 'Mercredi'),
            (3, 'Jeudi'),
            (4, 'Vendredi'),
            (5, 'Samedi'),
            (6, 'Dimanche'),
        ]
    )
    start_time = models.TimeField()
    end_time = models.TimeField()
    
    class Meta:
        unique_together = ['coach', 'day_of_week', 'start_time', 'end_time']
        verbose_name_plural = "Availabilities"
    
    def clean(self):
        if self.start_time >= self.end_time:
            raise ValidationError("L'heure de début doit être antérieure à l'heure de fin")
        
        # Vérifier le chevauchement avec d'autres disponibilités
        overlapping = Availability.objects.filter(
            coach=self.coach,
            day_of_week=self.day_of_week
        ).exclude(id=self.id)
        
        for avail in overlapping:
            if (self.start_time < avail.end_time and 
                self.end_time > avail.start_time):
                raise ValidationError("Cette période chevauche une disponibilité existante")
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)