from django.views.generic import TemplateView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.status import HTTP_204_NO_CONTENT


class HomeView(TemplateView):
	template_name = 'web/index.htm'


@api_view(('HEAD', 'GET'))
def connection_test_view(request):
	return Response(status=HTTP_204_NO_CONTENT)
