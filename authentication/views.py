import logging

from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from django.views import View

from authentication import create_auth_token

logger = logging.getLogger(__name__)


class LoginView(View):
	"""
	Check the credentials and return the REST Token if the credentials are valid.
	Calls Django Auth login method to register User ID in Django session framework

	Return the Authentication Token Object's key.
	"""

	def get(self, request):
		return JsonResponse(
			{'detail': 'GET method is not allowed.'}, status=405)

	def post(self, request):
		msg = 'Invalid credentials provided.'
		try:
			username = request.POST['username']
			password = request.POST['password']
			user = authenticate(username=username, password=password)
			if user:
				if user.is_active:
					return self.login(request, user)
				else:
					msg = 'User is banned.'
		except KeyError:
			msg = 'Provide both username and password in request body.'
		return JsonResponse({'detail': msg}, status=400)

	def login(self, request, user):
		login(request, user)
		token = create_auth_token(user)
		return JsonResponse(
			{'token': token},
			status=200
		)
