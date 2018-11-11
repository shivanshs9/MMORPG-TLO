from django.contrib.auth.signals import user_logged_out
from django.dispatch import Signal


user_logged_in = Signal(providing_args=["request", "user"])
user_signed_up = Signal(providing_args=["request", "user"])

password_set = Signal(providing_args=["request", "user"])
password_changed = Signal(providing_args=["request", "user"])
password_reset = Signal(providing_args=["request", "user"])
