from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer
from player.models import Player


GAME_USERS = 'game.users'
COMMAND_LIST_USERS = 'command_list_users'


class GameConsumer(JsonWebsocketConsumer):
    def connect(self):
        self.group = 'game.core'
        async_to_sync(self.channel_layer.group_add)(
            self.group, self.channel_name)
        user = self.scope['user']
        if user.is_authenticated:
            player = user.player
            if not player.active_channel:
                player.active_channel = self.channel_name
                player.save()
                self.accept('Token' if self.scope['subprotocols'] else None)

    def disconnect(self, close_code):
        user = self.scope["user"]
        print(f'{user} disconnected with {close_code}')
        player = user.player
        player.active_channel = None
        player.save()
        async_to_sync(self.channel_layer.group_discard)(
            self.group, self.channel_name)

    def receive_json(self, content, **kwargs):
        # message = content['message']
        command = content['command']
        if command == COMMAND_LIST_USERS:
            users = list(Player.objects.filter(
                active_channel__isnull=False).values_list('user__username', flat=True))
            print(users)
            self.send_json({
                'users': users
            })
        # async_to_sync(self.channel_layer.group_send)(
        #     self.group,
        #     {
        #         'type': 'room_message',
        #         'message': message
        #     }
        # )

    # Receive message from room group
    def room_message(self, event):
        message = event['message']
        self.send_json({
            'message': message
        })
