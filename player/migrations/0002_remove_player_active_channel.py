# Generated by Django 2.1.1 on 2018-11-12 06:59

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('player', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='player',
            name='active_channel',
        ),
    ]