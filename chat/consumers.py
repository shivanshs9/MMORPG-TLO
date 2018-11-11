from channels.generic.websocket import JsonWebsocketConsumer
from asgiref.sync import async_to_sync


class ChatConsumer(JsonWebsocketConsumer):
    def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.group = 'chat_%s' % self.room_name
        async_to_sync(self.channel_layer.group_add)(
            self.group, self.channel_name)
        user = self.scope['user']
        print(user)
        self.accept('Token' if self.scope['subprotocols'] else None)

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            self.group, self.channel_name)

    def receive_json(self, content, **kwargs):
        message = content['message']
        async_to_sync(self.channel_layer.group_send)(
            self.group,
            {
                'type': 'room_message',
                'message': message
            }
        )

    # Receive message from room group
    def room_message(self, event):
        message = event['message']
        self.send_json({
            'message': message
        })
