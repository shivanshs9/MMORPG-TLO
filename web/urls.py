from django.urls import include, path

from web.views import HomeView

app_name = 'web'

urlpatterns = [
	path('', HomeView.as_view(), name='home'),
]
