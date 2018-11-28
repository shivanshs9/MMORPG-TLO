from rest_framework import serializers

from chat import models


class ChatRoomSerializer(serializers.ModelSerializer):
	class Meta:
		model = models.ChatRoom
		fields = ('name', 'persist_messages')


class ChatMessageSerializer(serializers.ModelSerializer):
	is_self = serializers.SerializerMethodField()
	sender_name = serializers.CharField(source='sender.display_name')
	sender_avatar = serializers.CharField(source='sender.avatar_uri')

	class Meta:
		model = models.ChatMessage
		fields = ('sender_name', 'sender_avatar', 'sent_at', 'body', 'is_self')

	def get_is_self(self, obj):
		if not self.context.get('user', None):
			return
		return obj.sender == self.context.get('user')


class ChatMemberSerializer(serializers.ModelSerializer):
	class Meta:
		model = models.ChatMember
		fields = ('user', 'joined', 'is_owner', 'is_admin')
