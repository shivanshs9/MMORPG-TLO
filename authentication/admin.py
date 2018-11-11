from django.contrib import admin
from . import models


@admin.register(models.AuthToken)
class AuthTokenAdmin(admin.ModelAdmin):
	list_display = ('token_key', 'user', 'created', 'expires')