from rest_framework import generics, permissions

from player.models import Player
from player.serializers import PlayerDetailsSerializer


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
