from django.contrib import admin

from chat import models


class ChatMemberInline(admin.TabularInline):
	model = models.ChatMember
	extra = 1


@admin.register(models.ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
	inlines = (ChatMemberInline, )


@admin.register(models.ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
	pass
