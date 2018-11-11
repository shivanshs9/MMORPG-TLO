from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DefaultUserAdmin

from player.models import Player


@admin.register(Player)
class PlayerAdmin(DefaultUserAdmin):
	list_display = ('ign', 'email', 'date_joined')
	fieldsets = list(DefaultUserAdmin.fieldsets) + [
		(
			'Player data',
			{'fields': ('ign', 'level', 'avatar_uri', 'art', 'gold')}
		)
	]