from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.views.generic import View

from player.models import Player


class DetailPlayerView(View):
	def get(self, request, player_id):
		try:
			player: Player = Player.objects.get(pk=player_id)
			return JsonResponse(player.details, status=200)
		except Player.DoesNotExist:
			return JsonResponse(
				{'detail': 'No user exists with the give user ID.'}, status=404
			)


class DetailSelfView(LoginRequiredMixin, View):
	def get(self, request):
		return JsonResponse(request.user.details, status=200)

	def post(self, request):
		player = request.user
		player.ign = request.POST.get('ign', player.ign)
		player.gold = request.POST.get('gold', player.gold)
		player.art = request.POST.get('art', player.art)
		player.level = request.POST.get('level', player.level)
		player.avatar_uri = request.POST.get('avatar', player.avatar_uri)
		player.save()
		return JsonResponse(
			{'detail': 'Updated player data.'}, status=200
		)
