import binascii
from os import urandom as generate_bytes

from django.conf import settings
from importlib import import_module

from authentication import CONSTANTS

HashAlgorithm = import_module(settings.AUTH_TOKEN_SECURE_HASH_ALGORITHM)


def create_token_string():
	return binascii.hexlify(
		generate_bytes(int(settings.AUTH_TOKEN_CHARACTER_LENGTH / 2))
	).decode()


def create_salt_string():
	return binascii.hexlify(
		generate_bytes(int(CONSTANTS.SALT_LENGTH / 2))).decode()


def hash_token(token, salt):
	'''
	Calculates the hash of a token and salt.
	input is unhexlified

	token and salt must contain an even number of hex digits or
	a binascii. Error exception will be raised
	'''
	digest = HashAlgorithm.new()
	digest.update(binascii.unhexlify(token))
	digest.update(binascii.unhexlify(salt))
	return binascii.hexlify(digest.digest()).decode()
