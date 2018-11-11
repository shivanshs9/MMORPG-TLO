from channels.routing import ProtocolTypeRouter, URLRouter
from authentication.auth import TokenAuthMiddlewareStack
import game.urls
import chat.urls

APP = ProtocolTypeRouter({
    # HTTP -> Django views by Default
    'websocket': TokenAuthMiddlewareStack(
        URLRouter(
            chat.urls.websocket_urlpatterns +
            game.urls.websocket_urlpatterns
        )
    ),
})
