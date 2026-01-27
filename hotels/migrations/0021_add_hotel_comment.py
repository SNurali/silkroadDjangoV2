# Generated manually for HotelComment model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('hotels', '0020_hotel_emehmon_id_roomtype_capacity_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='HotelComment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('rating', models.IntegerField(choices=[(1, '1'), (2, '2'), (3, '3'), (4, '4'), (5, '5')], default=5, verbose_name='рейтинг')),
                ('comment', models.TextField(verbose_name='комментарий')),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')], default='pending', max_length=20, verbose_name='статус модерации')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='создано')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='обновлено')),
                ('hotel', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comments', to='hotels.hotel', verbose_name='отель')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='hotel_comments', to=settings.AUTH_USER_MODEL, verbose_name='пользователь')),
            ],
            options={
                'verbose_name': 'комментарий об отеле',
                'verbose_name_plural': 'комментарии об отелях',
                'db_table': 'tb_hotel_comment',
                'ordering': ['-created_at'],
            },
        ),
    ]
