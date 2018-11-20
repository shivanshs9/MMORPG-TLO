from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.functional import cached_property

UserModel = get_user_model()


class Save(models.Model):
	player = models.OneToOneField(
		UserModel, on_delete=models.CASCADE,
		related_name='game_save', null=True
	)
	save_data = models.TextField(null=True, blank=True)
	global_data = models.TextField(null=True, blank=True)
	config_data = models.TextField(null=True, blank=True)

	created = models.DateTimeField(auto_now_add=True)
	updated = models.DateTimeField(auto_now=True)

	def __str__(self):
		return f'Save: {self.player}'

	@cached_property
	def last_saved(self):
		return self.updated


class Client(models.Model):
	player = models.OneToOneField(
		UserModel, on_delete=models.CASCADE,
		related_name='game_client', null=True
	)
	channel_game = models.TextField()
	channel_chat = models.TextField(null=True, blank=True)
	created = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f'{self.player} @{self.channel_name}'


@receiver(post_save, sender=UserModel, dispatch_uid='new_save')
def new_save(sender, instance, created, **kwargs):
	if created:
		Save.objects.create(player=instance)
