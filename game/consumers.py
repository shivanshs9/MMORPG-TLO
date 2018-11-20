from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer

from game.game_map import GameMapConsumer
from game.models import Client


class GameConsumer(JsonWebsocketConsumer):
    MESSAGE_TYPE_LIST_USERS = 'game.list_users'
    MESSAGE_TYPE_NEW_USER = 'game.new_user'
    MESSAGE_TYPE_LEAVE_USER = 'game.leave_user'
    MESSAGE_TYPE_DESCRIBE_USER = 'game.describe_user'

    COMMAND_LIST_USERS = 'game.list_users'

    def connect(self):
        self.group = 'game'
        self.player = self.scope['user']
        self.id = self.player.username
        if not self.can_user_play():
            return
        self.accept('Token' if self.scope['subprotocols'] else None)
        self.new_player()
        self.initialize()

    def initialize(self):
        self.consume_map = GameMapConsumer(self)

    def can_user_play(self):
        if not self.player.is_authenticated:
            return False
        if Client.objects.filter(player=self.player).exists():
            Client.objects.filter(player=self.player).delete()
        return True

    def describe_player(self, player):
        self.send_json({
            "type": GameConsumer.MESSAGE_TYPE_DESCRIBE_USER,
            "username": player.username
        })

    def new_player(self):
        async_to_sync(self.channel_layer.group_send)(
            self.group,
            {
                "type": "broadcast.new_player",
                "username": self.player.username
            }
        )
        async_to_sync(self.channel_layer.group_add)(
            self.group, self.channel_name)
        Client.objects.create(player=self.player, channel_game=self.channel_name)
        self.describe_player(self.player)
        self.send_users()

    def broadcast_new_player(self, event):
        self.send_json({
            'type': GameConsumer.MESSAGE_TYPE_NEW_USER,
            'username': event['username']
        })

    def cleanup(self):
        self.leave_player(self.player)
        self.consume_map.cleanup()

    def disconnect(self, close_code):
        print(f'{self.player} disconnected with {close_code}')
        self.cleanup()

    def leave_player(self, player):
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
            "type": GameConsumer.MESSAGE_TYPE_LEAVE_USER,
            "username": event["username"]
        })

    def send_users(self):
        users = Client.objects.all().select_related(
            'player').values_list('player__username', flat=True)
        self.send_json({
            "type": GameConsumer.MESSAGE_TYPE_LIST_USERS,
            "users": list(users)
        })

    def receive_json(self, content, **kwargs):
        command = content.pop('command')
        if command == GameConsumer.COMMAND_LIST_USERS:
            self.send_users()
        func = self.consume_map.read_command(command)
        if func:
            func(content, **kwargs)
            return
        print(f'Unsupported command: {command}')
