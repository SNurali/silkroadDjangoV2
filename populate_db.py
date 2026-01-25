
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'silkroad_backend.settings')
django.setup()

from accounts.models import User
from locations.models import Country, Region, District
from hotels.models import Hotel, RoomType, Room, Sight, Category
from vendors.models import Vendor, VendorImage

def populate():
    print("Populating database...")
    
    # Create Country/Region
    uzb, _ = Country.objects.get_or_create(name="Uzbekistan", iso_code="UZ")
    tashkent, _ = Region.objects.get_or_create(name="Tashkent", country=uzb)
    
    # Create Admin
    if not User.objects.filter(email="admin@silkroad.uz").exists():
        admin = User.objects.create_superuser("admin@silkroad.uz", "password")
        print("Created Admin: admin@silkroad.uz / password")
    
    # Create User
    if not User.objects.filter(email="test@example.com").exists():
        user = User.objects.create_user(email="test@example.com", password="password", name="Test User")
        print("Created User: test@example.com / password")
    else:
        user = User.objects.get(email="test@example.com")

    # Create Vendor User & Profile
    if not User.objects.filter(email="vendor@silkroad.uz").exists():
        v_user = User.objects.create_user(email="vendor@silkroad.uz", password="password", role="vendor", name="Vendor Bob")
        print("Created Vendor User")
    else:
        v_user = User.objects.get(email="vendor@silkroad.uz")
        
    # Vendor Profile
    cat, _ = Category.objects.get_or_create(name="Hotels", entry_by=user)
    
    vendor_profile, created = Vendor.objects.get_or_create(
        user=v_user,
        defaults={
            "name": "Grand Silk Road Hotel",
            "country": uzb,
            "region": tashkent,
            "category": cat,
            "address": "123 Amir Temur Str."
        }
    )
    if created:
        print("Created Vendor Profile")

    # Hotel
    hotel, created = Hotel.objects.get_or_create(
        name="Hyatt Regency Tashkent",
        defaults={
            "region": tashkent,
            "description": "Luxury 5-star hotel in the heart of Tashkent.",
            "stars": 5,
            "address": "Navoi Street 1",
            "created_by": v_user,
            "deposit": 250.00
        }
    )
    if created:
        print("Created Hotel: Hyatt Regency Tashkent")
        
    # Sight (linked to Vendor) mechanism in models? 
    # Sight model usually has 'vendor' FK.
    sight, created = Sight.objects.get_or_create(
        name="Hyatt Regency Tashkent Sight",
        defaults={
            "vendor": vendor_profile,
            "category": cat,
            "status": "active",
            "address": "Navoi Street 1",
            "description": "Best hotel - Sight view.",
            "is_foreg": 250.00,
            "is_local": 150.00,
            "amenities_services": {"wifi": "Free", "pool": "Yes"},
            "images": "/media/images/default-hotel.jpg"
        }
    )
    # The frontend uses /api/sights/ which returns SightSerializer data.
    # HotelListView.jsx uses getSights.
    
    print("Database populated successfully.")

if __name__ == '__main__':
    populate()
