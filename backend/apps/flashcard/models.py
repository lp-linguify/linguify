from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from math import ceil


class Deck(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="decks",
        verbose_name=_("Owner")
    )
    title = models.CharField(
        max_length=255,
        verbose_name=_("Deck Title"),
        help_text=_("A descriptive title of the deck.")
    )
    description = models.TextField(
        blank=True,
        verbose_name=_("Deck Description")
    )
    language = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name=_("Language"),
        help_text=_("Language of the deck (e.g., 'French', 'Spanish').")
    )
    date_created = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Date Created")
    )

    class Meta:
        verbose_name = _("Deck")
        verbose_name_plural = _("Decks")
        ordering = ["-date_created"]
        unique_together = [('user', 'title')]
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['title']),
        ]

    def __str__(self):
        return f"{self.title} (Owner: {self.user.username})"

    def get_absolute_url(self):
        return reverse('deck-detail', kwargs={'pk': self.pk})

    def get_card_count(self):
        return self.cards.count()


class Tag(models.Model):
    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name=_("Tag Name")
    )

    class Meta:
        verbose_name = _("Tag")
        verbose_name_plural = _("Tags")
        ordering = ["name"]

    def __str__(self):
        return self.name

    def get_card_count(self):
        return self.cards.count()


class Card(models.Model):
    deck = models.ForeignKey(
        Deck,
        on_delete=models.CASCADE,
        related_name="cards",
        verbose_name=_("Deck")
    )
    front_text = models.CharField(
        max_length=255,
        verbose_name=_("Front Text"),
        help_text=_("Text on the front side of the card.")
    )
    back_text = models.CharField(
        max_length=255,
        verbose_name=_("Back Text"),
        blank=True,
        null=True,
        help_text=_("Text on the back side of the card.")
    )
    image = models.ImageField(
        upload_to='flashcard_images/',
        null=True,
        blank=True,
        verbose_name=_("Image")
    )
    tags = models.ManyToManyField(
        Tag,
        blank=True,
        related_name="cards",
        verbose_name=_("Tags")
    )
    date_created = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Date Created")
    )
    last_updated = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Last Updated")
    )

    class Meta:
        verbose_name = _("Card")
        verbose_name_plural = _("Cards")
        ordering = ["-date_created"]
        indexes = [
            models.Index(fields=['deck']),
        ]
        constraints = [
            models.UniqueConstraint(fields=['deck', 'front_text'], name='unique_deck_front_text')
        ]

    def __str__(self):
        return f"Card {self.pk} in Deck '{self.deck.title}'"

    def get_absolute_url(self):
        return reverse('card-detail', kwargs={'pk': self.pk})


class UserFlashcardProgress(models.Model):
    """
    Tracks a user's learning progress for a card using spaced repetition (SM-2 like).
    """
    class Status(models.TextChoices):
        NOT_STARTED = 'not_started', _("Not Started")
        IN_PROGRESS = 'in_progress', _("In Progress")
        COMPLETED = 'completed', _("Completed")

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="card_progress",
        verbose_name=_("User")
    )
    card = models.ForeignKey(
        Card,
        on_delete=models.CASCADE,
        related_name="user_progress",
        verbose_name=_("Card")
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NOT_STARTED,
        verbose_name=_("Status")
    )
    percentage_completion = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=0,
        verbose_name=_("Percentage Completion"),
        help_text=_("Estimate of how well the user knows this card (0-100%).")
    )
    score = models.IntegerField(
        validators=[MinValueValidator(0)],
        default=0,
        verbose_name=_("Score"),
        help_text=_("A numeric rating (0-5 recommended) representing review quality.")
    )
    time_studied = models.PositiveIntegerField(
        validators=[MinValueValidator(0)],
        default=0,
        verbose_name=_("Time Studied (minutes)")
    )
    last_reviewed = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Last Reviewed")
    )

    due_date = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Due Date"),
        help_text=_("Next scheduled review date.")
    )
    interval_days = models.PositiveIntegerField(
        default=1,
        verbose_name=_("Interval Days"),
        help_text=_("Number of days until the next review.")
    )
    easiness_factor = models.FloatField(
        default=2.5,
        validators=[MinValueValidator(1.3), MaxValueValidator(3.0)],
        verbose_name=_("Easiness Factor"),
        help_text=_("Spaced repetition factor (1.3 to 3.0).")
    )
    review_count = models.PositiveIntegerField(
        default=0,
        verbose_name=_("Review Count")
    )

    class Meta:
        verbose_name = _("User Flashcard Progress")
        verbose_name_plural = _("User Flashcard Progresses")
        unique_together = ('user', 'card')
        ordering = ["-last_reviewed"]
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['card']),
            models.Index(fields=['due_date']),
        ]

    def __str__(self):
        return f"Progress of {self.user.username} on Card {self.card.pk}: {self.status}, {self.percentage_completion}%"

    def update_progress(
        self,
        status=None,
        percentage_completion=None,
        score=None,
        time_studied=None
    ):
        """
        Update the user's progress on this card and apply the SM-2-like spaced repetition algorithm.

        Args:
            status (str, optional): Update the card's learning status.
            percentage_completion (int, optional): New knowledge estimate (0-100).
            score (int, optional): Quality of recall (0-5 recommended).
            time_studied (int, optional): Additional time studied in minutes.

        The SM-2 algorithm adjustments:
        - If score < 3, reset repetition cycle.
        - Otherwise, update EF and interval based on formula.
        """
        if status is not None:
            self.status = status
        if percentage_completion is not None:
            self.percentage_completion = percentage_completion
        if time_studied is not None:
            self.time_studied += time_studied  # add time studied this session
        if score is not None:
            self.score = score
            self.apply_spaced_repetition_logic()

        self.last_reviewed = timezone.now()
        self.save()

    def apply_spaced_repetition_logic(self):
        """
        Apply SM-2 spaced repetition logic to update interval_days and easiness_factor.
        """
        q = self.score  # quality (0-5)
        if q < 3:
            # If quality is low, reset intervals
            self.interval_days = 1
            self.review_count = 1
        else:
            # Increase repetition count
            self.review_count += 1
            # Adjust easiness factor
            self.easiness_factor = self._calculate_ef(self.easiness_factor, q)

            # Update interval depending on how many reviews done so far
            if self.review_count == 1:
                self.interval_days = 1
            elif self.review_count == 2:
                self.interval_days = 6
            else:
                # After second repetition, intervals are EF-based
                prev_interval = self.interval_days
                new_interval = ceil(prev_interval * self.easiness_factor)
                self.interval_days = max(new_interval, 1)  # Ensure at least 1 day

        # Update due_date based on the new interval
        self.due_date = timezone.now() + timezone.timedelta(days=self.interval_days)

    @staticmethod
    def _calculate_ef(current_ef, q):
        """
        Calculate the new easiness factor based on the SM-2 formula.

        EF' = EF + (0.1 - (5 - q)*(0.08 + (5 - q)*0.02))
        Clamp between 1.3 and 3.0.
        """
        new_ef = current_ef + (0.1 - (5 - q)*(0.08 + (5 - q)*0.02))
        return max(1.3, min(3.0, new_ef))
