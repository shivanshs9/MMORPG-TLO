import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.functional import cached_property


def player_avatar_path(instance, filename):
	return f'players/{instance.ign}/avatar.png'


class Player(AbstractUser):
	ART_ROUGE = 'Rouge'
	ART_MAGE = 'Mage'
	ART_PRIEST = 'Priest'
	ART_BARBARIAN = 'Barbarian'
	PLAYER_ART_CHOICES = [
		(ART_ROUGE, 'Rouge'),
		(ART_MAGE, 'Mage'),
		(ART_PRIEST, 'Priest'),
		(ART_BARBARIAN, 'Barbarian')
	]

	uid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	ign = models.CharField(max_length=16, null=True, blank=True)
	avatar_uri = models.TextField(blank=True, null=True)
	level = models.PositiveIntegerField(default=0)
	gold = models.PositiveIntegerField(default=0)
	art = models.CharField(
		choices=PLAYER_ART_CHOICES, max_length=16,
		null=True, blank=True
	)

	active_channel = models.CharField(max_length=100, blank=True, null=True)

	def __str__(self):
		if self.ign:
			return f'Player: {self.ign}'
		else:
			return f'User: {self.username}'

	@cached_property
	def details(self):
		data = {
			'ign': self.ign,
			'art': self.art,
			'avatar_uri': self.avatar_uri,
			'level': self.level,
			'gold': self.gold
		}
		return data
