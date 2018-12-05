# Generated by Django 2.1.1 on 2018-11-26 14:56

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('chat', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='chatroom',
            name='users',
            field=models.ManyToManyField(related_name='chats', related_query_name='chat', through='chat.ChatMember', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='chatmessage',
            name='chat',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='messages', related_query_name='message', to='chat.ChatRoom'),
        ),
        migrations.AddField(
            model_name='chatmessage',
            name='sender',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='messages', related_query_name='message', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='chatmember',
            name='chat',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='chat.ChatRoom'),
        ),
        migrations.AddField(
            model_name='chatmember',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterUniqueTogether(
            name='chatmember',
            unique_together={('user', 'chat')},
        ),
    ]