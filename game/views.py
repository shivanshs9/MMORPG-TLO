from django.views.generic import TemplateView
from rest_framework.generics import RetrieveAPIView, UpdateAPIView
from rest_framework.permissions import IsAuthenticated

from game.models import Save
from game.serializers import SaveDataSerializer


class PlayView(TemplateView):
	template_name = 'game/index.html'


class SaveGameView(UpdateAPIView):
	permission_classes = (IsAuthenticated, )
	serializer_class = SaveDataSerializer

	def get_object(self):
		return Save.objects.get(player=self.request.user)


class LoadGameView(RetrieveAPIView):
	permission_classes = (IsAuthenticated, )
	serializer_class = SaveDataSerializer

	def get_object(self):
		return Save.objects.get(player=self.request.user)
