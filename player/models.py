import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.urls import reverse
from django.utils.functional import cached_property


def player_avatar_path(instance, filename):
	return f'players/{instance.ign}/avatar.png'


class Player(AbstractUser):
	ART_ROUGE = 'Rouge'
	ART_MAGE = 'Mage'
	ART_PRIEST = 'Priest'
	ART_BARBARIAN = 'Barbarian'
	ART_UNKNOWN = 'Unknown'
	PLAYER_ART_CHOICES = [
		(ART_UNKNOWN, 'Unknown'),
		(ART_ROUGE, 'Rouge'),
		(ART_MAGE, 'Mage'),
		(ART_PRIEST, 'Priest'),
		(ART_BARBARIAN, 'Barbarian')
	]

	PLAYER_GENDER = [
		('m', 'Male'),
		('f', 'Female')
	]

	# uid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	ign = models.CharField(max_length=16, null=True, blank=True)
	avatar_uri = models.TextField(blank=True, null=True)
	level = models.PositiveIntegerField(default=0)
	gold = models.PositiveIntegerField(default=0)
	art = models.CharField(
		choices=PLAYER_ART_CHOICES, max_length=16,
		null=True, blank=True
	)
	gender = models.CharField(
		choices=PLAYER_GENDER, max_length=1, default='m')

	def __str__(self):
		return self.display_name

	@cached_property
	def display_name(self):
		return self.ign or self.username

	def get_absolute_url(self):
		return reverse('player:detail-player', args=(self.pk, ))
