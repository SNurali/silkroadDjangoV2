from django.core.management.base import BaseCommand
from django.utils import timezone
from decimal import Decimal
from django.contrib.auth.hashers import make_password
from pathlib import Path

from locations.models import Country, Region
from hotels.models import Category, Sight, SightFacility
from vendors.models import Vendor
from accounts.models import User


class Command(BaseCommand):
    help = 'Создаёт тестовые данные для демонстрации сайта с реальными путями фото'

    def handle(self, *args, **options):
        self.stdout.write('Создаём тестовые данные...')

        # 1. Тестовый админ
        admin, _ = User.objects.get_or_create(
            email='admin@silkroad.uz',
            defaults={
                'name': 'Admin',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
                'password': make_password('admin123'),
                'is_active': True,
            }
        )

        # 2. Страна и регионы
        uzbekistan, _ = Country.objects.get_or_create(
            name='Узбекистан',
            defaults={'iso_code': 'UZ', 'is_active': True}
        )

        samarkand, _ = Region.objects.get_or_create(
            name='Самаркандская область',
            country=uzbekistan,
            defaults={'is_active': True}
        )

        tashkent, _ = Region.objects.get_or_create(
            name='Ташкентская область',
            country=uzbekistan,
            defaults={'is_active': True}
        )

        # 3. Категории
        cat1, _ = Category.objects.get_or_create(name='Исторические памятники', defaults={'is_active': True})
        cat2, _ = Category.objects.get_or_create(name='Природные парки', defaults={'is_active': True})
        cat3, _ = Category.objects.get_or_create(name='Музеи и галереи', defaults={'is_active': True})

        # 4. Вендоры
        vendor1, _ = Vendor.objects.get_or_create(
            name='Samarkand Tour LLC',
            defaults={
                'country': uzbekistan,
                'region': samarkand,
                'is_active': True,
                'address': 'Самарканд, ул. Регистан 5',
                'entry_by': admin,
            }
        )

        vendor2, _ = Vendor.objects.get_or_create(
            name='Tashkent Adventures',
            defaults={
                'country': uzbekistan,
                'region': tashkent,
                'is_active': True,
                'address': 'Ташкент, ул. Навои 10',
                'entry_by': admin,
            }
        )

        # 5. Достопримечательности + реальные пути фото
        sights_data = [
            {
                'name': 'Регистан',
                'vendor': vendor1,
                'category': cat1,
                'sh_description': 'Великолепная площадь с тремя медресе — жемчужина Самарканда.',
                'description': 'Регистан — исторический центр Самарканда, окружённый тремя медресе XVI века.',
                'address': 'Самарканд, площадь Регистан',
                'geolocation': '39.6547,66.9758',
                'images': 'sights/0000/1/2019/10/15/1x.jpg,sights/0000/1/2019/10/15/22.jpg',  # реальные пути
                'status': 'active',
                'is_foreg': Decimal('150000'),
                'is_local': Decimal('30000'),
                'enable_tickets': True,
                'created_by': admin,
            },
            {
                'name': 'Гур-Эмир',
                'vendor': vendor1,
                'category': cat1,
                'sh_description': 'Мавзолей Амира Темура и его потомков.',
                'description': 'Гур-Эмир — усыпальница Тамерлана и его семьи, выдающийся памятник тимуридской архитектуры.',
                'address': 'Самарканд, ул. Рудаки',
                'geolocation': '39.6481,66.9697',
                'images': 'sights/0000/1/2019/10/15/221.jpg',
                'status': 'active',
                'is_foreg': Decimal('100000'),
                'is_local': Decimal('20000'),
                'enable_tickets': True,
                'created_by': admin,
            },
            {
                'name': 'Чорсу Базар',
                'vendor': vendor2,
                'category': cat2,
                'sh_description': 'Самый старый и колоритный базар Ташкента.',
                'description': 'Чорсу — сердце старого Ташкента, где можно попробовать настоящую плов и специи.',
                'address': 'Ташкент, Чорсу',
                'geolocation': '41.3245,69.2347',
                'images': 'sights/frontend/img/chorsu.jpg',  # подставь реальный путь из media
                'status': 'active',
                'is_foreg': Decimal('0'),
                'is_local': Decimal('0'),
                'enable_tickets': False,
                'created_by': admin,
            },
            # ... добавь остальные, если нужно
        ]

        for data in sights_data:
            sight, created = Sight.objects.get_or_create(
                name=data['name'],
                defaults=data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Создана достопримечательность: {sight.name}'))

        # Удобства (пример)
        sight_registan = Sight.objects.filter(name='Регистан').first()
        if sight_registan:
            SightFacility.objects.get_or_create(sight=sight_registan, name='Парковка')
            SightFacility.objects.get_or_create(sight=sight_registan, name='Гид на русском')
            SightFacility.objects.get_or_create(sight=sight_registan, name='Аудиогид')

        self.stdout.write(self.style.SUCCESS('Тестовые данные успешно созданы!'))
        self.stdout.write('Зайди на главную — там должны быть карточки с фото.')