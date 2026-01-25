from django.core.management.base import BaseCommand
from hotels.models import Hotel

class Command(BaseCommand):
    help = 'Normalizes hotel prices (deposit) from UZS to USD if they exceed a threshold.'

    def handle(self, *args, **options):
        # Exchange rate: 1 USD = 12500 UZS (Approx)
        EXCHANGE_RATE = 12500
        THRESHOLD = 10000 # Values above this are considered UZS

        hotels = Hotel.objects.filter(deposit__gt=THRESHOLD)
        
        count = 0
        for hotel in hotels:
            old_price = hotel.deposit
            new_price = round(old_price / EXCHANGE_RATE, 2)
            
            hotel.deposit = new_price
            hotel.save()
            
            self.stdout.write(self.style.SUCCESS(f"Converted '{hotel.name}': {old_price} UZS -> {new_price} USD"))
            count += 1

        # Also check deposit_turizm if needed
        # But based on inspection, deposit is the main issue for the filter logic.
        
        self.stdout.write(self.style.SUCCESS(f"Successfully normalized {count} hotels."))
