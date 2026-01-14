from django.core.management.base import BaseCommand
from django.utils import timezone
from decimal import Decimal
from django.contrib.auth.hashers import make_password  # ← добавлен импорт

from locations.models import Country, Region
from hotels.models import Category, Sight, SightFacility
from vendors.models import Vendor
from accounts.models import User


class Command(BaseCommand):
    help = 'Создаёт тестовые данные для демонстрации сайта'

    def handle(self, *args, **options):
        self.stdout.write('Создаём тестовые данные...')

        # 1. Тестовый админ
        admin, created = User.objects.get_or_create(
            email='admin@silkroad.uz',
            defaults={
                'name': 'Admin',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
                'password': make_password('admin123'),  # ← теперь работает
                'is_active': True,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('Создан тестовый админ: admin@silkroad.uz / admin123'))

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

        # 5. Достопримечательности
        sights_data = [
            {
                'name': 'Регистан',
                'vendor': vendor1,
                'category': cat1,
                'sh_description': 'Великолепная площадь с тремя медресе — жемчужина Самарканда.',
                'description': 'Регистан — исторический центр Самарканда, окружённый тремя медресе XVI века.',
                'address': 'Самарканд, площадь Регистан',
                'geolocation': '39.6547,66.9758',
                'images': 'https://example.com/registan1.jpg,https://example.com/registan2.jpg',
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
                'images': 'https://example.com/gur-emir1.jpg',
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
                'images': 'https://example.com/chorsu1.jpg,https://example.com/chorsu2.jpg',
                'status': 'active',
                'is_foreg': Decimal('0'),
                'is_local': Decimal('0'),
                'enable_tickets': False,
                'created_by': admin,
            },
            {
                'name': 'Мемориал Шахидлар Хотираси',
                'vendor': vendor2,
                'category': cat1,
                'sh_description': 'Мемориальный комплекс памяти жертв репрессий.',
                'description': 'Музей и мемориал, посвящённый жертвам политических репрессий в Узбекистане.',
                'address': 'Ташкент, ул. Шахидлар',
                'geolocation': '41.2995,69.2401',
                'images': 'https://example.com/shahidlar1.jpg',
                'status': 'active',
                'is_foreg': Decimal('50000'),
                'is_local': Decimal('10000'),
                'enable_tickets': True,
                'created_by': admin,
            },
            {
                'name': 'Горы Чимган',
                'vendor': vendor2,
                'category': cat2,
                'sh_description': 'Горный курорт недалеко от Ташкента.',
                'description': 'Зимой — лыжи, летом — треккинг и свежий воздух. Популярное место отдыха.',
                'address': 'Ташкентская область, Чимган',
                'geolocation': '41.5667,69.9667',
                'images': 'https://example.com/chimgan1.jpg,https://example.com/chimgan2.jpg',
                'status': 'active',
                'is_foreg': Decimal('80000'),
                'is_local': Decimal('40000'),
                'enable_tickets': True,
                'created_by': admin,
            },
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
        self.stdout.write('Зайди на главную — там должны быть карточки.')