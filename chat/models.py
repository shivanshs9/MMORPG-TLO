import uuid

from django.contrib.auth import get_user_model
from django.db import models

UserModel = get_user_model()


class ChatRoomQuerySet(models.QuerySet):
	def find_by_member(self, user):
		return user.chats.all()

	def new_or_add_users(self, room, user, users=list(), persist_messages=False):
		"""
		Creates a new ChatRoom, if not existing. Adds given users as chat members.

		Arguments:
			room {str} -- ChatRoom name
			user {UserModel} -- User instance which requested this.

		Keyword Arguments:
			users {[str]} -- [description] (default: {list()})
			persist_messages {bool} -- [description] (default: {False})

		Returns:
			[ChatRoom, [UserModel]] -- Tuple of ChatRoom instance and list of new users.
		"""

		new_users = list()
		created = False
		chat = None
		try:
			chat = self.get(name=room)
			if not ChatMember.objects.filter(user=user, chat=chat).exists():
				ChatMember.objects.create(user=user, chat=chat)
				new_users.append(user)
		except ChatRoom.DoesNotExist:
			chat = self.create(room=room, persist_messages=persist_messages)
			ChatMember.objects.create(user=user, chat=chat, is_admin=True, is_owner=True)
			new_users.append(user)
			created = True
		for username in users:
			try:
				instance = UserModel.objects.get(username=username)
				if not ChatMember.objects.filter(user=instance, chat=chat).exists():
					ChatMember.objects.create(user=instance, chat=chat)
					new_users.append(instance)
			except UserModel.DoesNotExist:
				pass
		return (chat, new_users)


class ChatRoom(models.Model):
	uid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

	name = models.CharField(
		max_length=15, default='Unknown', unique=True,
		error_messages={
			"unique": 'The room name is already taken!'
		}
	)
	users = models.ManyToManyField(
		UserModel, through='ChatMember',
		related_name='chats', related_query_name='chat'
	)
	persist_messages = models.BooleanField(default=False)

	objects = ChatRoomQuerySet.as_manager()

	def __str__(self):
		return f'{self.name}'


class ChatMember(models.Model):
	uid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

	user = models.ForeignKey(UserModel, on_delete=models.CASCADE)
	chat = models.ForeignKey(ChatRoom, on_delete=models.CASCADE)

	joined = models.DateTimeField(auto_now_add=True)
	is_owner = models.BooleanField(default=False)
	is_admin = models.BooleanField(default=False)

	class Meta:
		unique_together = ('user', 'chat')

	def __str__(self):
		return f'{self.chat} - {self.user}'


class ChatMessage(models.Model):
	uid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

	chat = models.ForeignKey(
		ChatRoom, on_delete=models.CASCADE,
		related_name='messages', related_query_name='message'
	)
	sender = models.ForeignKey(
		UserModel, on_delete=models.CASCADE,
		related_name='messages', related_query_name='message'
	)
	sent_at = models.DateTimeField(auto_now_add=True)
	body = models.TextField()

	def __str__(self):
		return f'{self.chat} - {self.message}'
