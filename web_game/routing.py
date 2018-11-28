from channels.routing import ProtocolTypeRouter, URLRouter
from authentication.auth import TokenAuthMiddlewareStack
import game.urls, chat.urls

APP = ProtocolTypeRouter({
    # HTTP -> Django views by Default
    'websocket': TokenAuthMiddlewareStack(
        URLRouter(
            game.urls.websocket_urlpatterns +
            chat.urls.websocket_urlpatterns
        )
    ),
})
