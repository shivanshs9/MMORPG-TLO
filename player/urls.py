from django.urls import path

from player import views

urlpatterns = [
	path('self/', views.DetailSelfView.as_view(), name='detail-self'),
	path('<slug:player_id>/', views.DetailPlayerView.as_view(), name='detail-player')
]
