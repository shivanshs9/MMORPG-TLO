from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.views.generic import TemplateView, View

from game.models import Save


class PlayView(TemplateView):
	template_name = 'game/index.html'


class SaveGameView(LoginRequiredMixin, View):
	def post(self, request):
		user = request.user
		data = dict()
		config_data = request.POST.get('config_data', None)
		save_data = request.POST.get('save_data', None)
		global_data = request.POST.get('global_data', None)
		if config_data:
			data['config_data'] = config_data
		if save_data:
			data['save_data'] = save_data
		if global_data:
			data['global_data'] = global_data
		obj, created = Save.objects.update_or_create(
			player=user, defaults=data
		)
		return JsonResponse(
			{'detail': 'Game saved successfully.'}, status=200)


class LoadGameView(LoginRequiredMixin, View):
	raise_exception = True

	def get(self, request):
		data = {}
		try:
			user = request.user
			save = Save.objects.get(player=user)
			data = {
				'config_data': save.config_data,
				'global_data': save.global_data,
				'save_data': save.save_data,
				'last_save': save.updated
			}

		except Save.DoesNotExist:
			data = {
				'config_data': None,
				'global_data': None,
				'save_data': None,
				'last_save': None
			}
		return JsonResponse(
			data, status=200
		)
