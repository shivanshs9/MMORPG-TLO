from django.contrib import admin

from game.models import Save


@admin.register(Save)
class SaveAdmin(admin.ModelAdmin):
	list_display = ('player', 'created', 'updated')
