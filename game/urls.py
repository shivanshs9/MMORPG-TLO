from django.urls import path

from . import consumers, views

app_name = 'game'

websocket_urlpatterns = [
    path('game/', consumers.GameConsumer)
]

urlpatterns = [
    path('play/', views.PlayView.as_view(), name='play'),
    path('save/', views.SaveGameView.as_view(), name='save-progress'),
    path('load/', views.LoadGameView.as_view(), name='load-progress'),
]
