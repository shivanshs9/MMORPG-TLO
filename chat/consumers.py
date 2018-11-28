from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer

from chat import models, serializers
from game.models import Client


class ChatConsumer(JsonWebsocketConsumer):
    MESSAGE_TYPE_ROOM_NEW_PLAYER = 'chat.room.new_player'
    MESSAGE_TYPE_ROOM_LEAVE_PLAYER = 'chat.room.leave_player'
    MESSAGE_TYPE_ROOM_NEW_MESSAGE = 'chat.room.new_message'
    MESSAGE_TYPE_ROOM_LIST_MESSAGES = 'chat.room.list_messages'
    MESSAGE_TYPE_ROOM_LIST_PLAYERS = 'chat.room.list_players'

    MESSAGE_TYPE_NEW_ROOM = 'chat.new_room'
    MESSAGE_TYPE_DELETE_ROOM = 'chat.remove_room'
    MESSAGE_TYPE_ALTER_ROOM = 'chat.alter_room'
    MESSAGE_TYPE_LIST_ROOMS = 'chat.list_rooms'

    COMMAND_LIST_ROOMS = 'chat.list_rooms'
    COMMAND_ROOM_LIST_MESSAGES = 'chat.room.list_messages'
    COMMAND_ROOM_LIST_PLAYERS = 'chat.room.list_players'
    COMMAND_JOIN_ROOM = 'chat.join_room'
    COMMAND_LEAVE_ROOM = 'chat.leave_room'
    COMMAND_ROOM_SEND_MESSAGE = 'chat.room.send_message'

    def connect(self):
        self.user = self.scope['user']
        if not self.user.is_authenticated:
            return
        if self.update_client():
            self.accept('Token' if self.scope['subprotocols'] else None)
            self.initialize()

    def update_client(self):
        clients = Client.objects.filter(player=self.user)
        if clients:
            clients.update(channel_chat=self.channel_name)
            return True
        return False

    def initialize(self):
        self.list_rooms()
        self.join_rooms()

    def disconnect(self, code):
        Client.objects.filter(player=self.user).update(channel_chat=None)

    def join_rooms(self):
        rooms = models.ChatRoom.objects.find_by_member(
            self.user).values_list('name', flat=True)
        for room in rooms:
            async_to_sync(self.channel_layer.group_add)(room, self.channel_name)

    def list_rooms(self):
        rooms = models.ChatRoom.objects.find_by_member(self.user)
        data = serializers.ChatRoomSerializer(rooms, many=True).data

        self.send_json({
            "type": ChatConsumer.MESSAGE_TYPE_LIST_ROOMS,
            "data": data
        })

    def list_room_messages(self, room):
        msgs = models.ChatMessage.objects.filter(chat__name=room)
        data = serializers.ChatMessageSerializer(
            msgs, many=True, context={
                'user': self.user
            }
        ).data

        self.send_json({
            "type": ChatConsumer.MESSAGE_TYPE_ROOM_LIST_MESSAGES,
            "room": room,
            "data": data
        })

    def create_or_join_room(self, content):
        room = content['room']
        content['user'] = self.user
        if content.pop('ephemeral', False):
            async_to_sync(self.channel_layer.group_add)(room, self.channel_name)
            self.broadcast_new_room({'room': room})
            return
        chat, users = models.ChatRoom.objects.new_or_add_users(**content)
        clients = Client.objects.filter(
            player__in=users, channel_chat__isnull=False)
        for client in clients:
            self.room_new_member(room, client.player)
            async_to_sync(self.channel_layer.group_add)(room, client.channel_chat)
            async_to_sync(self.channel_layer.send)(
                client.channel_chat,
                {
                    "type": "broadcast.new_room",
                    "room": room
                }
            )

    def broadcast_new_room(self, event):
        self.send_json({
            "type": ChatConsumer.MESSAGE_TYPE_NEW_ROOM,
            "room": event['room']
        })

    def room_new_member(self, room, player):
        async_to_sync(self.channel_layer.group_send)(
            room,
            {
                "type": "broadcast.room.new_member",
                "room": room,
                "user": str(player)
            }
        )

    def broadcast_room_new_member(self, event):
        self.send_json({
            "type": ChatConsumer.MESSAGE_TYPE_ROOM_NEW_PLAYER,
            "room": event['room'],
            "user": event['user']
        })

    def leave_room(self, room):
        try:
            chat = models.ChatRoom.objects.get(name=room)
            models.ChatMember.objects.filter(chat=chat, user=self.user).delete()
            async_to_sync(self.channel_layer.group_discard)(room, self.channel_name)
            async_to_sync(self.channel_layer.group_send)(
                room,
                {
                    "type": 'broadcast.room.leave_member',
                    "room": room,
                    "user": str(self.user),
                }
            )
        except models.ChatRoom.DoesNotExist:
            pass
        self.list_rooms()

    def broadcast_room_leave_member(self, event):
        self.send_json({
            "type": ChatConsumer.MESSAGE_TYPE_ROOM_LEAVE_PLAYER,
            "room": event['room'],
            "user": event['user']
        })

    def room_list_players(self, room):
        players = models.ChatMember.objects.filter(chat__name=room)
        data = serializers.ChatMemberSerializer(players, many=True).data

        self.send_json({
            "type": ChatConsumer.MESSAGE_TYPE_ROOM_LIST_PLAYERS,
            "room": room,
            "data": data
        })

    def room_send_message(self, room, msg):
        try:
            chat = models.ChatRoom.objects.get(name=room)
        except models.ChatRoom.DoesNotExist:
            chat = None
        instance = models.ChatMessage(
            body=msg, sender=self.user, chat=chat
        )
        data = serializers.ChatMessageSerializer(
            instance, context={'user': None}).data
        async_to_sync(self.channel_layer.group_send)(
            room,
            {
                "type": "broadcast.room.new_message",
                "room": room,
                "data": data
            }
        )
        if chat and chat.persist_messages:
            instance.save()

    def broadcast_room_new_message(self, event):
        self.send_json({
            "type": ChatConsumer.MESSAGE_TYPE_ROOM_NEW_MESSAGE,
            "room": event['room'],
            "data": event['data'],
            "is_self": event['data']['sender_name'] == str(self.user)
        })

    def receive_json(self, content, **kwargs):
        command = content.pop('command')
        room = content.get('room', None)
        if command == ChatConsumer.COMMAND_LIST_ROOMS:
            self.list_rooms()
        elif command == ChatConsumer.COMMAND_ROOM_LIST_MESSAGES:
            self.list_room_messages(room)
        elif command == ChatConsumer.COMMAND_JOIN_ROOM:
            self.create_or_join_room(content)
        elif command == ChatConsumer.COMMAND_LEAVE_ROOM:
            self.leave_room(room)
        elif command == ChatConsumer.COMMAND_ROOM_LIST_PLAYERS:
            self.room_list_players(room)
        elif command == ChatConsumer.COMMAND_ROOM_SEND_MESSAGE:
            msg = content.get('message')
            self.room_send_message(room, msg)
        else:
            print(f'Unsupported command: {command}')
