from django.urls import path
from . import views

app_name = 'auth'

urlpatterns = [
	path('', views.AuthView.as_view(), name='login-register'),
	path('login/', views.LoginView.as_view(), name='login'),
	path('logout/', views.LogoutView.as_view(), name='logout'),
]
