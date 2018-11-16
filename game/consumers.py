from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer

from common.util import get_url_kwarg
from game.models import Client


class GameConsumer(JsonWebsocketConsumer):
    MESSAGE_TYPE_LIST_USERS = 'game.list_users'
    MESSAGE_TYPE_NEW_USER = 'game.new_user'
    MESSAGE_TYPE_LEAVE_USER = 'game.leave_user'
    MESSAGE_TYPE_DESCRIBE_USER = 'game.describe_user'

    COMMAND_LIST_USERS = 'command.list_users'

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

    def describe_player(self, player):
        self.send_json({
            "type": GameConsumer.MESSAGE_TYPE_DESCRIBE_USER,
            "username": player.username
        })

    def new_player(self, player):
        async_to_sync(self.channel_layer.group_send)(
            self.group,
            {
                "type": "broadcast.new_player",
                "username": player.username
            }
        )
        async_to_sync(self.channel_layer.group_add)(
            self.group, self.channel_name)
        Client.objects.create(player=player, channel_name=self.channel_name)
        self.describe_player(player)
        self.send_users()

    def broadcast_new_player(self, event):
        self.send_json({
            'type': GameConsumer.MESSAGE_TYPE_NEW_USER,
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
            "type": GameConsumer.MESSAGE_TYPE_LEAVE_USER,
            "username": event["username"]
        })

    def receive_json(self, content, **kwargs):
        command = content['command']
        if command == GameConsumer.COMMAND_LIST_USERS:
            self.send_users()

    def send_users(self):
        users = Client.objects.all().select_related(
            'player').values_list('player__username', flat=True)
        self.send_json({
            "type": GameConsumer.MESSAGE_TYPE_LIST_USERS,
            "users": list(users)
        })


class MapConsumer(JsonWebsocketConsumer):
    MESSAGE_TYPE_LEAVE_PLAYER = 'map.leave_player'
    MESSAGE_TYPE_UPDATE_PLAYER = 'map.update_player'

    COMMAND_UPDATE_SELF = 'command.update_self'

    def connect(self):
        self.group = get_url_kwarg(self.scope, 'map_id')
        self.player = self.scope['user']
        self.accept('Token' if self.scope['subprotocols'] else None)
        self.new_player()

    def new_player(self):
        async_to_sync(self.channel_layer.group_add)(
            self.group, self.channel_name)

    def disconnect(self, code):
        async_to_sync(self.channel_layer.group_discard)(
            self.group, self.channel_name)
        async_to_sync(self.channel_layer.group_send)(
            self.group,
            {
                'type': 'broadcast.leave_player',
                'id': self.channel_name,
            }
        )

    def broadcast_leave_player(self, event):
        self.send_json({
            "type": MapConsumer.MESSAGE_TYPE_LEAVE_PLAYER,
            "id": event['id']
        })

    def receive_json(self, content, **kwargs):
        command = content.pop('command')
        if command == MapConsumer.COMMAND_UPDATE_SELF:
            content['id'] = self.channel_name
            content['name'] = self.player.ign
            self.update_map(content)

    def update_map(self, content):
        async_to_sync(self.channel_layer.group_send)(
            self.group,
            {
                'type': 'broadcast.update_player',
                'data': content
            }
        )

    def broadcast_update_player(self, event):
        if (event['data']['id'] == self.channel_name):
            return
        self.send_json({
            "type": MapConsumer.MESSAGE_TYPE_UPDATE_PLAYER,
            "data": event['data']
        })
