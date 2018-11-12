import logging

from django.contrib.auth import login
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK

from authentication import create_auth_token, serializers

logger = logging.getLogger(__name__)


class LoginView(GenericAPIView):
	"""
	Check the credentials and return the REST Token if the credentials are valid.

	Return the Authentication Token Object's key.
	"""
	serializer_class = serializers.LoginSerializer
	permission_classes = (AllowAny, )

	def get_queryset(self):
		return

	def login(self, user):
		self.token = create_auth_token(user)

		# login(self.request, user)

	def get_response(self):
		serializer = serializers.TokenSerializer({'token': self.token})
		return Response(serializer.data, status=HTTP_200_OK)

	def post(self, request, *args, **kwargs):
		self.request = request
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		self.login(serializer.save())
		return self.get_response()
