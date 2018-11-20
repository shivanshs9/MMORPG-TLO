from asgiref.sync import async_to_sync

from common.consumers import AbstractConsumer


class GameMapConsumer(AbstractConsumer):
    MESSAGE_TYPE_LEAVE_PLAYER = 'map.leave_player'
    MESSAGE_TYPE_UPDATE_PLAYER = 'map.update_player'

    COMMAND_ENTER_MAP = 'map.enter_map'
    COMMAND_UPDATE_SELF = 'map.update_self'
    COMMAND_LEAVE_MAP = 'map.leave_map'

    def __init__(self, consumer, **kwargs):
        super().__init__(consumer, **kwargs)
        consumer.map_broadcast_update_player = self.broadcast_update_player
        consumer.map_broadcast_leave_player = self.broadcast_leave_player

    def set_group(self, mapId):
        self.group = 'map.' + str(mapId)

    def broadcast_update_player(self, event):
        if (event['data']['id'] == self.consumer.id):
            return
        self.consumer.send_json({
            "type": GameMapConsumer.MESSAGE_TYPE_UPDATE_PLAYER,
            "data": event['data']
        })

    def broadcast_leave_player(self, event):
        self.consumer.send_json({
            "type": GameMapConsumer.MESSAGE_TYPE_LEAVE_PLAYER,
            "id": event['id']
        })

    def update_map(self, content, **kwargs):
        self.set_group(content['map'])

        content['id'] = self.consumer.id
        content['name'] = self.consumer.player.ign
        async_to_sync(self.consumer.channel_layer.group_send)(
            self.group,
            {
                'type': 'map.broadcast.update_player',
                'data': content
            }
        )

    def enter_map(self, content):
        self.set_group(content['map'])

        async_to_sync(self.consumer.channel_layer.group_add)(
            self.group, self.consumer.channel_name
        )

    def leave_map(self, content):
        if not self.group:
            self.set_group(content['map'])

        async_to_sync(self.consumer.channel_layer.group_discard)(
            self.group, self.consumer.channel_name)
        async_to_sync(self.consumer.channel_layer.group_send)(
            self.group,
            {
                'type': 'map.broadcast.leave_player',
                'id': self.consumer.id
            }
        )

    def cleanup(self):
        super().cleanup()
        self.leave_map({})

    def read_command(self, command):
        if command == GameMapConsumer.COMMAND_UPDATE_SELF:
            return self.update_map
        elif command == GameMapConsumer.COMMAND_ENTER_MAP:
            return self.enter_map
        elif command == GameMapConsumer.COMMAND_LEAVE_MAP:
            return self.leave_map
        return None
