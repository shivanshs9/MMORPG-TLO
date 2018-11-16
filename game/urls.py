from channels.routing import URLRouter
from django.urls import include, path

from . import consumers, views

websocket_urlpatterns = [
    path('game/', URLRouter([
        path('', consumers.GameConsumer),
        path('map/<slug:map_id>/', consumers.MapConsumer),
    ]))
]

urlpatterns = [
    path('play/', views.PlayView.as_view(), name='play-game'),
    path('save/', views.SaveGameView.as_view(), name='save-game'),
    path('load/', views.LoadGameView.as_view(), name='load-game'),
]
