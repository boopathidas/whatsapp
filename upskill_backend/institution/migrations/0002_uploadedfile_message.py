# Generated by Django 5.0.7 on 2024-12-04 05:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('institution', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='uploadedfile',
            name='message',
            field=models.TextField(blank=True, null=True),
        ),
    ]