from django.core.validators import RegexValidator


room_name_validator = RegexValidator(
	regex=r'^__\c*', inverse_match=True, code='invalid-name',
	message='The given room name is invalid! Beware of using underscores in the beginning.'
)
