from django import forms

class ChatForm(forms.Form):
	name = forms.CharField(max_length=60)
