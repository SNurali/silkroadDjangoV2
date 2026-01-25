from django.core.management.base import BaseCommand
from cabs.models import Cab

class Command(BaseCommand):
    help = 'Populate cabs data'

    def handle(self, *args, **kwargs):
        cabs_data = [
            {
                "name": "Standard Sedan",
                "slug": "standard_sedan",
                "price": 150000,
                "capacity": "3 Guests",
                "rating": 4.8,
                "features": ["AC", "Bluetooth", "Water"],
                "order": 1
            },
            {
                "name": "Luxury Sedan",
                "slug": "luxury_sedan",
                "price": 350000,
                "capacity": "3 Guests",
                "rating": 4.9,
                "features": ["Leather", "WiFi", "Premium Sound"],
                "order": 2
            },
            {
                "name": "Minivan (Airport)",
                "slug": "minivan",
                "price": 450000,
                "capacity": "6 Guests",
                "rating": 4.7,
                "features": ["Extra Luggage", "Spacious", "Reclining Seats"],
                "order": 3
            },
            {
                "name": "Business Van",
                "slug": "business_van",
                "price": 600000,
                "capacity": "10 Guests",
                "rating": 5.0,
                "features": ["Conference Table", "TV Screen", "Minibar"],
                "order": 4
            }
        ]

        for data in cabs_data:
            Cab.objects.get_or_create(slug=data['slug'], defaults=data)
        
        self.stdout.write(self.style.SUCCESS('Successfully populated Cabs'))
