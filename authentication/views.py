from django.contrib.auth import login, logout
from django.shortcuts import redirect, render
from django.urls import reverse
from django.views.generic import TemplateView, View
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK

from authentication import create_auth_token, forms, serializers


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

		login(self.request, user)

	def get_response(self):
		serializer = serializers.TokenSerializer({'token': self.token})
		return Response(serializer.data, status=HTTP_200_OK)

	def post(self, request, *args, **kwargs):
		self.request = request
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		self.login(serializer.save())
		return self.get_response()


class AuthView(TemplateView):
	template_name = 'authentication/login_register.htm'

	def get_context_data(self, **kwargs):
		context = super().get_context_data(**kwargs)
		context['form_login'] = forms.LoginForm()
		context['form_register'] = forms.RegisterForm()
		return context

	def post(self, request):
		loginForm = forms.LoginForm(request.POST)
		registerForm = forms.RegisterForm(request.POST)
		errors = None
		logged_in = False
		user = None
		if loginForm.is_valid():
			logged_in = True
			user = loginForm.save()
			if user:
				login(request, user)
				return redirect(reverse('web:home'))
			else:
				errors = loginForm.non_field_errors
		if registerForm.is_valid():
			user = registerForm.save()
		if not logged_in:
			errors = "You're are successfully registered!" if user else registerForm.non_field_errors
		context = self.get_context_data()
		context['errors'] = errors
		if logged_in:
			context['form_login'] = loginForm
		else:
			context['form_register'] = registerForm
		return render(
			request, template_name=self.template_name, context=context)


class LogoutView(View):
	def get(self, request):
		logout(request)
		return redirect(reverse('web:home'))
