from django.urls import include, path

from web import views

app_name = 'web'

urlpatterns = [
	path('', views.HomeView.as_view(), name='home'),
	path('connection-test/', views.connection_test_view, name='connection-test'),
]
