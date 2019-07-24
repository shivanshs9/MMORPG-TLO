# from django.shortcuts import render
# from django.http import HttpResponse
# from django.utils.safestring import mark_safe
# from .forms import ChatForm
# # from .utils import connection, get_results

# def index(request):
#     return render(request, 'chat/index.htm')


# def room(request, room_name):
#     context = {
#         'room_name': mark_safe(room_name)
#     }
#     return render(request, 'chat/room.htm', context)

# def chat_form(request):
# 	if request.method == 'POST':
# 		form = ChatForm(request.POST)
# 		if form.is_valid():
# 			try:
# 				with connection.cursor() as cursor:
# 					sql = 'INSERT INTO Chat(name) VALUES (%s);'
# 					cursor.execute(sql, (form.cleaned_data.get('name'), ))
# 				connection.commit()
# 				result = None
# 				with connection.cursor() as cursor:
# 					sql = 'SELECT * FROM Chat;'
# 					cursor.execute(sql)
# 					result = cursor.fetchall()
# 				return HttpResponse(str(result))
# 			finally:
# 				connection.close()
# 		context = {
# 			'form': form,
# 			'title': 'Chat Form'
# 		}
# 		return render(request, 'chat/form.htm', context)
# 	form = ChatForm()
# 	context = {
# 		'form': form,
# 		'title': 'Chat Form'
# 	}
# 	return render(request, 'chat/form.htm', context)

# def chat_table(request):
# 	header = result = None
# 	try:
# 		with connection.cursor() as cursor:
# 			sql = 'SELECT * FROM Chat;'
# 			cursor.execute(sql)
# 			header, data = get_results(cursor)
# 		print(result)
# 	finally:
# 		context = {
# 			'data': data,
# 			'header': header
# 		}
# 		return render(request, 'chat/result.htm', context)
