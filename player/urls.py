from django.urls import path

from player import views, feed

app_name = 'player'

urlpatterns = [
	path('self/', views.DetailSelfView.as_view(), name='detail-self'),
	path('profile/', views.PlayerProfileView.as_view(), name='profile'),
	path('feeds/', feed.PlayerFeed()),
	path('detail/<slug:player_id>/', views.DetailPlayerView.as_view(), name='detail-player'),
]
