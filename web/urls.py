from django.urls import include, path

from web.views import HomeView

urlpatterns = [
	path('', HomeView.as_view(), name='home'),
]
