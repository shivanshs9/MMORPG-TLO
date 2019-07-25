import os
import datetime


AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY', '')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_KEY', '')
AWS_FILE_EXPIRE = 200
AWS_PRELOAD_METADATA = True
AWS_QUERYSTRING_AUTH = True
AWS_S3_SIGNATURE_VERSION = 's3v4'

DEFAULT_FILE_STORAGE = 'web_game.aws.utils.MediaRootS3BotoStorage'
STATICFILES_STORAGE = 'web_game.aws.utils.StaticRootS3BotoStorage'
AWS_STORAGE_BUCKET_NAME = 'mmorpg-tlo'
AWS_S3_HOST = 's3.ap-south-1.amazonaws.com'
S3_USE_SIGV4 = True
AWS_S3_REGION_NAME = 'ap-south-1'
S3_URL = '//%s.s3.amazonaws.com/' % AWS_STORAGE_BUCKET_NAME
MEDIA_URL = '//%s.s3.amazonaws.com/media/' % AWS_STORAGE_BUCKET_NAME
MEDIA_ROOT = MEDIA_URL
STATIC_URL = S3_URL + 'static/'
ADMIN_MEDIA_PREFIX = STATIC_URL + 'admin/'

two_months = datetime.timedelta(days=61)
date_two_months_later = datetime.date.today() + two_months
expires = date_two_months_later.strftime("%A, %d %B %Y 20:00:00 GMT")

AWS_HEADERS = { 
    'Expires': expires,
    'Cache-Control': 'max-age=%d' % (int(two_months.total_seconds()), ),
}
