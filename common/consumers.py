class AbstractConsumer(object):
	def __init__(self, consumer, **kwargs):
		self.consumer = consumer

	def read_command(self, command):
		"""
		Parses the given command and returns back a callback function or None,
		depending on whether the command is supported by this consumer.

		Arguments:
			object {[type]} -- [description]
			command {str} -- Command string.
		"""

		pass
	
	def cleanup(self):
		pass
