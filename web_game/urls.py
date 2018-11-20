from django.contrib import admin
from django.urls import path, include
from django.conf import settings

urlpatterns = [
	path('auth/', include('authentication.urls')),
	path('game/', include('game.urls')),
	path('player/', include('player.urls')),
	path('', include('web.urls')),
	path('admin/', admin.site.urls),
]


if settings.DEBUG:
	import debug_toolbar
	urlpatterns += [
		path('__debug__/', include(debug_toolbar.urls)),
	]
