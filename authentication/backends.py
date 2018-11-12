import binascii

from django.contrib.auth.backends import ModelBackend
from django.utils import timezone
from rest_framework import exceptions

from authentication import CONSTANTS, crypto
from authentication.models import AuthToken

try:
	from hmac import compare_digest
except ImportError:
	def compare_digest(a, b):
		return a == b


class TokenBackend(ModelBackend):
	def authenticate(self, request, token=None):
		user = None
		if not token:
			return
		for auth_token in AuthToken.objects.filter(
			token_key=token[:CONSTANTS.TOKEN_KEY_LENGTH]):
			try:
				digest = crypto.hash_token(token, auth_token.salt)
			except (TypeError, binascii.Error):
				raise exceptions.AuthenticationFailed('Unable to hash the token')
			if compare_digest(digest, auth_token.digest):
				if auth_token.expires and auth_token.expires < timezone.now():
					auth_token.delete()
					raise exceptions.AuthenticationFailed('Token has expired. Login again.')
				user = auth_token.user
				break
		if user and self.user_can_authenticate(user):
			return user
