
import os
import django
import random
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'silkroad_backend.settings')
django.setup()

from flights.models import Airline, Airport, Flight
from locations.models import Country

def run():
    print("Populating Flights Data...")

    # 1. Create Countries (if not exist)
    uz, _ = Country.objects.get_or_create(iso_code='UZ', defaults={'name': 'Uzbekistan', 'name_ru': 'Узбекистан'})
    us, _ = Country.objects.get_or_create(iso_code='US', defaults={'name': 'United States', 'name_ru': 'США'})
    tr, _ = Country.objects.get_or_create(iso_code='TR', defaults={'name': 'Turkey', 'name_ru': 'Турция'})
    ae, _ = Country.objects.get_or_create(iso_code='AE', defaults={'name': 'United Arab Emirates', 'name_ru': 'ОАЭ'})
    ru, _ = Country.objects.get_or_create(iso_code='RU', defaults={'name': 'Russia', 'name_ru': 'Россия'})

    # 2. Create Airports
    airports_data = [
        {'code': 'TAS', 'name': 'Tashkent International Airport', 'city': 'Tashkent', 'country': uz},
        {'code': 'SKD', 'name': 'Samarkand International Airport', 'city': 'Samarkand', 'country': uz},
        {'code': 'UGC', 'name': 'Urgench International Airport', 'city': 'Urgench', 'country': uz},
        {'code': 'JFK', 'name': 'John F. Kennedy International Airport', 'city': 'New York', 'country': us},
        {'code': 'IST', 'name': 'Istanbul Airport', 'city': 'Istanbul', 'country': tr},
        {'code': 'DXB', 'name': 'Dubai International Airport', 'city': 'Dubai', 'country': ae},
        {'code': 'SVO', 'name': 'Sheremetyevo International Airport', 'city': 'Moscow', 'country': ru},
    ]

    airports = []
    for data in airports_data:
        ap, created = Airport.objects.get_or_create(code=data['code'], defaults=data)
        airports.append(ap)
        if created:
            print(f"Created Airport: {ap}")

    # 3. Create Airlines
    airlines_data = [
        {'code': 'HY', 'name': 'Uzbekistan Airways'},
        {'code': 'TK', 'name': 'Turkish Airlines'},
        {'code': 'SU', 'name': 'Aeroflot'},
        {'code': 'FZ', 'name': 'FlyDubai'},
    ]

    airlines = []
    for data in airlines_data:
        al, created = Airline.objects.get_or_create(code=data['code'], defaults=data)
        airlines.append(al)
        if created:
            print(f"Created Airline: {al}")

    # 4. Create Flights (Mock Schedule)
    # Generate flights for the next 30 days
    now = timezone.now()
    
    # Clean up old mock flights if needed? No, let's just append.
    
    count = 0
    for day in range(30):
        date = now + timedelta(days=day)
        
        # 5 flights per day
        for _ in range(5):
            origin = random.choice(airports)
            destination = random.choice([a for a in airports if a != origin])
            airline = random.choice(airlines)
            
            # Random time
            hour = random.randint(0, 23)
            minute = random.choice([0, 15, 30, 45])
            departure_time = date.replace(hour=hour, minute=minute, second=0, microsecond=0)
            
            # Duration 2-12 hours
            duration_hours = random.randint(2, 12)
            arrival_time = departure_time + timedelta(hours=duration_hours)
            
            # Price
            base_price = random.randint(200, 1200)
            
            flight = Flight.objects.create(
                airline=airline,
                flight_number=f"{airline.code}-{random.randint(100, 999)}",
                origin=origin,
                destination=destination,
                departure_time=departure_time,
                arrival_time=arrival_time,
                price_economy=base_price,
                price_business=base_price * 2.5,
                seats_economy=random.randint(100, 300),
                seats_business=random.randint(10, 50),
                is_active=True
            )
            count += 1
            
    print(f"Successfully created {count} flights.")

if __name__ == '__main__':
    run()
