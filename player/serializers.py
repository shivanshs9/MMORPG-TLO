from rest_framework import serializers

from player.models import Player


class PlayerDetailsSerializer(serializers.ModelSerializer):
	class Meta:
		model = Player
		fields = (
			'pk', 'ign', 'art', 'level', 'gold', 'avatar_uri'
		)
		read_only_fields = (
			'pk',
		)
