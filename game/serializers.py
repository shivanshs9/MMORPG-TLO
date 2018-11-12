from rest_framework import serializers
from game.models import Save


class SaveDataSerializer(serializers.ModelSerializer):
	class Meta:
		model = Save
		fields = (
			'save_data', 'global_data', 'config_data', 'last_saved'
		)
