from channels.auth import AuthMiddlewareStack
from django.contrib.auth.models import AnonymousUser
from django.db import close_old_connections
from rest_framework import exceptions
from rest_framework.authentication import (
	BaseAuthentication,
	get_authorization_header
)

from authentication import backends, models


# Channels Auth Middleware
class TokenAuthMiddleware:
	"""
	Token authorization middleware for Django Channels 2
	"""

	def __init__(self, inner):
		self.inner = inner

	def __call__(self, scope):
		headers = dict(scope['headers'])
		scope['user'] = AnonymousUser()
		if b'sec-websocket-protocol' in headers:
			token_name, token = headers[b'sec-websocket-protocol'].decode().split(',')
			token = token.strip()
			try:
				if token_name != 'Token':
					raise exceptions.AuthenticationFailed('Invalid header!')
				user = backends.TokenBackend().authenticate(scope, token=token)
				if not user:
					raise exceptions.AuthenticationFailed('Authentication failed!')
				scope['user'] = user				
			except exceptions.AuthenticationFailed as e:
				scope['error'] = e
			close_old_connections()
		return self.inner(scope)

TokenAuthMiddlewareStack = lambda inner: TokenAuthMiddleware(AuthMiddlewareStack(inner))


# Rest Framework Auth Middleware
class TokenAuthentication(BaseAuthentication):
	'''
	This authentication scheme uses Knox AuthTokens for authentication.

	Similar to DRF's TokenAuthentication, it overrides a large amount of that
	authentication scheme to cope with the fact that Tokens are not stored
	in plaintext in the database

	If succesful
	- `request.user` will be a django `User` instance
	- `request.auth` will be an `AuthToken` instance
	'''
	model = models.AuthToken
	keyword = 'Token'

	def authenticate(self, request):
		auth = get_authorization_header(request).split()

		if not auth or auth[0].lower() != b'token':
			return None
		if len(auth) == 1:
			msg = ('Invalid token header. No credentials provided.')
			raise exceptions.AuthenticationFailed(msg)
		elif len(auth) > 2:
			msg = (
				'Invalid token header. '
				'Token string should not contain spaces.'
			)
			raise exceptions.AuthenticationFailed(msg)

		return self.authenticate_credentials(auth[1])

	def authenticate_credentials(self, token):
		'''
		Due to the random nature of hashing a salted value, this must inspect
		each auth_token individually to find the correct one.

		Tokens that have expired will be deleted and skipped
		'''
		token = token.decode("utf-8")
		user = backends.TokenBackend().authenticate(None, token=token)
		if user:
			return (user, token)
		# Authentication with this token has failed
		raise exceptions.AuthenticationFailed('Invalid Token.')

	def authenticate_header(self, request):
		return self.keyword
