class CONSTANTS:
	'''
	Constants cannot be changed at runtime
	'''
	TOKEN_KEY_LENGTH = 8
	DIGEST_LENGTH = 128
	SALT_LENGTH = 16

	def __setattr__(self, *args, **kwargs):
		raise RuntimeError('''
			Constant values must NEVER be changed at runtime, as they are
			integral to the structure of database tables
			''')


CONSTANTS = CONSTANTS()


def create_auth_token(user):
	"""
	Generates a new Auth Token for a provided user.

	Arguments:
		user {User} -- The target user instance.

	Returns:
		token {str} -- Returns back the Authentication token to be used for
		further API communication with user.
	"""

	from .models import AuthToken
	try:
		old_token = AuthToken.objects.get(user=user)
		old_token.delete()
	except Exception:
		pass
	token = AuthToken.objects.create(user=user)
	return token
