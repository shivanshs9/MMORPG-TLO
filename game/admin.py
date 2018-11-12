from django.contrib import admin

from game.models import Save, Client


@admin.register(Save)
class SaveAdmin(admin.ModelAdmin):
	list_display = ('player', 'created', 'updated')


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
	pass