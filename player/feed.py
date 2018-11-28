from django.contrib.syndication.views import Feed

from player.models import Player


class PlayerFeed(Feed):
	title = 'TLO Players'
	link = '/player/'
	description = 'List of players'

	def items(self):
		return Player.objects.all()