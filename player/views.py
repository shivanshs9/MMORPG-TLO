from django.views.generic import TemplateView
from rest_framework import generics, permissions

from player.models import Player
from player.serializers import PlayerDetailsSerializer
from django.db import connection


class DetailPlayerView(generics.RetrieveAPIView):
	permission_classes = (permissions.AllowAny, )
	serializer_class = PlayerDetailsSerializer
	queryset = Player.objects.all()
	lookup_url_kwarg = 'player_id'


class DetailSelfView(generics.RetrieveUpdateAPIView):
	permission_classes = (permissions.IsAuthenticated, )
	serializer_class = PlayerDetailsSerializer

	def get_object(self):
		return self.request.user


class PlayerProfileView(TemplateView):
	template_name = 'player/view_profile.htm'

	def get_context_data(self, **kwargs):
		context = super().get_context_data(**kwargs)
		pk = str(self.request.user.pk)
		with connection.cursor() as cursor:
			cursor.execute(
				"SELECT username, ign, avatar_uri, first_name, last_name, email, level, gold, art, gender FROM player_player AS player WHERE player.id = %s", (pk, ))
			row = cursor.fetchone()
		context['data'] = row
		return context
