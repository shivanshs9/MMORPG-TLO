from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer

from game.models import Client

MESSAGE_TYPE_LIST_USERS = 'game.list_users'
MESSAGE_TYPE_NEW_USER = 'game.new_user'
MESSAGE_TYPE_LEAVE_USER = 'game.leave_user'

COMMAND_LIST_USERS = 'command.list_users'


class GameConsumer(JsonWebsocketConsumer):
    def connect(self):
        self.group = 'game'
        player = self.scope['user']
        if not self.can_user_play(player):
            return
        self.accept('Token' if self.scope['subprotocols'] else None)
        self.new_player(player)

    def can_user_play(self, player):
        if not player.is_authenticated:
            return False
        if Client.objects.filter(player=player).exists():
            Client.objects.filter(player=player).delete()
        return True

    def new_player(self, player):
        async_to_sync(self.channel_layer.group_add)(
            self.group, self.channel_name)
        Client.objects.create(player=player, channel_name=self.channel_name)
        async_to_sync(self.channel_layer.group_send)(
            self.group,
            {
                "type": "broadcast.new_player",
                "username": player.username
            }
        )

    def broadcast_new_player(self, event):
        self.send_json({
            'type': MESSAGE_TYPE_NEW_USER,
            'username': event['username']
        })

    def disconnect(self, close_code):
        player = self.scope["user"]
        print(f'{player} disconnected with {close_code}')
        self.leave_player(player)

    def leave_player(self, player):
        async_to_sync(self.channel_layer.group_discard)(
            self.group, self.channel_name)
        Client.objects.filter(player=player).delete()
        async_to_sync(self.channel_layer.group_send)(
            self.group,
            {
                "type": "broadcast.leave_player",
                "username": player.username
            }
        )

    def broadcast_leave_player(self, event):
        self.send_json({
            "type": MESSAGE_TYPE_LEAVE_USER,
            "username": event["username"]
        })

    def receive_json(self, content, **kwargs):
        command = content['command']
        if command == COMMAND_LIST_USERS:
            users = Client.objects.all().select_related('player').values_list('player__username', flat=True)
            self.send_json({
                "type": MESSAGE_TYPE_LIST_USERS,
                "users": list(users)
            })
