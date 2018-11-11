from django.core.exceptions import ValidationError


class AuthenticationFailed(ValidationError):
    pass
