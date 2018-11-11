from django.conf import settings
from django.db import models


class Save(models.Model):
	player = models.OneToOneField(
		settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
		related_name='game_save', null=True
	)
	save_data = models.TextField(null=True, blank=True)
	global_data = models.TextField(null=True, blank=True)
	config_data = models.TextField(null=True, blank=True)

	created = models.DateTimeField(auto_now_add=True)
	updated = models.DateTimeField(auto_now=True)

	def __str__(self):
		return f'Save: {self.player}'
