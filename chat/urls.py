from django.urls import path
# from . import views
from . import consumers

app_name = 'chat'

urlpatterns = [
# 	path('forms/chat/', views.chat_form, name='form-chat'),
# 	path('results/chat/', views.chat_table, name='table-chat'),
#     path('<slug:room_name>/', views.room, name='room'),
#     path('', views.index, name='index'),
]

websocket_urlpatterns = [
    path('chat/<slug:room_name>/', consumers.ChatConsumer)
]
