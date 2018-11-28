from django import forms
from django.contrib.auth import authenticate
from django.contrib.auth.forms import UserCreationForm, UsernameField
from django.db import IntegrityError

from player.models import Player


class LoginForm(forms.Form):
	error_messages = {
		'account_disabled': 'User account is disabled.',
		'invalid_credentials': 'Unable to log in with provided credentials.'
	}

	login_username = forms.CharField(label='Username')
	login_password = forms.CharField(label='Password', widget=forms.PasswordInput())

	def save(self):
		username = self.cleaned_data['login_username']
		password = self.cleaned_data['login_password']

		user = authenticate(username=username, password=password)
		if user:
			if not user.is_active:
				self.add_error(
					None, forms.ValidationError(
						self.error_messages['account_disabled'],
						code='account_disabled'
					)
				)
		else:
			self.add_error(
				None, forms.ValidationError(
					self.error_messages['invalid_credentials'],
					code='invalid_credentials'
				)
			)
		return user


class RegisterForm(UserCreationForm):
	class Meta:
		model = Player
		fields = ('username', 'password1', 'password2', 'email', 'first_name', 'last_name', 'gender')

	def save(self, commit=True):
		player = super().save(commit=False)
		player.email = self.cleaned_data['email']
		player.first_name = self.cleaned_data['first_name']
		player.last_name = self.cleaned_data['last_name']
		player.gender = self.cleaned_data['gender']
		player.save()
		return player
