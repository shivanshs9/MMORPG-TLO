from django.urls import path
from . import consumers, views

websocket_urlpatterns = [
    path('game/', consumers.GameConsumer)
]

urlpatterns = [
    path('play/', views.PlayView.as_view(), name='play-game'),
    path('save/', views.SaveGameView.as_view(), name='save-game'),
    path('load/', views.LoadGameView.as_view(), name='load-game'),
]
