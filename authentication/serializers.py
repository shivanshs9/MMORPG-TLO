from django.contrib.auth import authenticate
from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
	username = serializers.CharField()
	password = serializers.CharField(style={'input_type': 'password'})

	class Meta:
		fields = ('username', 'password')

	def save(self, **kwargs):
		username = self.validated_data['username']
		password = self.validated_data['password']

		user = authenticate(username=username, password=password)
		if user:
			if not user.is_active:
				raise serializers.ValidationError('User account is disabled.')
		else:
			raise serializers.ValidationError(
				'Unable to log in with provided credentials.')
		return user


class TokenSerializer(serializers.Serializer):
	token = serializers.CharField()

	class Meta:
		fields = ('token', )
