from django.urls import path
from chat.consumers import ChatConsumer

app_name = 'chat'

websocket_urlpatterns = [
	path('chat/', ChatConsumer)
]
