import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'silkroad_backend.settings')
django.setup()

from hotels.models import Sight, Category
from locations.models import Region
from django.contrib.auth import get_user_model

User = get_user_model()
admin = User.objects.filter(is_superuser=True).first() or User.objects.create_superuser('admin@mail.ru', 'password123')
vendor_user = User.objects.filter(email='vendor@mail.ru').first()
if not vendor_user:
    vendor_user = User.objects.create_user('vendor@mail.ru', 'password123', role='vendor')

# Create Regions
tashkent, _ = Region.objects.get_or_create(name='Tashkent')
samarkand, _ = Region.objects.get_or_create(name='Samarkand')
bukhara, _ = Region.objects.get_or_create(name='Bukhara')
khiva, _ = Region.objects.get_or_create(name='Xorazm') # Khiva is in Xorazm

# Create Categories
hotel_cat, _ = Category.objects.get_or_create(name='Hotel', slug='hotel')

# Create Sights
sights_data = [
    {
        'name': 'Hotel Tashkent Palace',
        'region': tashkent,
        'price_local': 1200000,
        'price_foreign': 150,
        'image_url': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800'
    },
    {
        'name': 'Silk Road Samarkand',
        'region': samarkand,
        'price_local': 2500000,
        'price_foreign': 250,
        'image_url': 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=800'
    },
    {
        'name': 'Bukhara Desert Oasis',
        'region': bukhara,
        'price_local': 900000,
        'price_foreign': 90,
        'image_url': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=800'
    },
    {
        'name': 'Khiva Old City Stars',
        'region': khiva,
        'price_local': 1100000,
        'price_foreign': 110,
        'image_url': 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800'
    }
]

from vendors.models import VendorProfile
vendor_profile, _ = VendorProfile.objects.get_or_create(user=vendor_user, defaults={'region': tashkent, 'organization_name': 'Best Hotels'})

for data in sights_data:
    s, created = Sight.objects.get_or_create(
        name=data['name'],
        defaults={
            'category': hotel_cat,
            'vendor': vendor_profile,
            'created_by': vendor_user,
            'price_local': data['price_local'],
            'price_foreign': data['price_foreign'],
            'address': f"{data['name']} Street, {data['region'].name}",
            'description': f"Luxury stay in {data['region'].name}",
            'status': 'active',
            'max_capacity': 2
        }
    )
    if created:
        print(f"Created: {s.name}")
    else:
        print(f"Exists: {s.name}")
