from rest_framework import serializers

from chat import models


class ChatRoomSerializer(serializers.ModelSerializer):
	class Meta:
		model = models.ChatRoom
		fields = ('name', 'persist_messages')


class ChatMessageSerializer(serializers.ModelSerializer):
	class Meta:
		model = models.ChatMessage
		fields = ('sender', 'send_at', 'body')


class ChatMemberSerializer(serializers.ModelSerializer):
	class Meta:
		model = models.ChatMember
		fields = ('user', 'joined', 'is_owner', 'is_admin')
