from channels.auth import AuthMiddlewareStack
from django.contrib.auth.models import AnonymousUser
from django.db import close_old_connections

from authentication import exceptions, backends


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
			if token_name != 'Token':
				raise exceptions.AuthenticationFailed('Invalid header!')
			user = backends.TokenBackend().authenticate(scope, token=token)
			if not user:
				raise exceptions.AuthenticationFailed('Authentication failed!')
			scope['user'] = user
			close_old_connections()
		return self.inner(scope)

TokenAuthMiddlewareStack = lambda inner: TokenAuthMiddleware(AuthMiddlewareStack(inner))
