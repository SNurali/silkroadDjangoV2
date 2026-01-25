from django.db import models
from django.utils.translation import gettext_lazy as _
from accounts.models import User
from locations.models import Country, Region

class Airline(models.Model):
    name = models.CharField(max_length=255, verbose_name=_('Airlines'))
    code = models.CharField(max_length=10, unique=True, verbose_name=_('IATA Code'))
    logo = models.ImageField(upload_to='airlines/', blank=True, null=True, verbose_name=_('Logo'))

    class Meta:
        verbose_name = _('Airline')
        verbose_name_plural = _('Airlines')

    def __str__(self):
        return f"{self.name} ({self.code})"

class Airport(models.Model):
    name = models.CharField(max_length=255, verbose_name=_('Name'))
    name_ru = models.CharField(max_length=255, blank=True, null=True)
    name_uz = models.CharField(max_length=255, blank=True, null=True)
    
    code = models.CharField(max_length=10, unique=True, verbose_name=_('IATA Code'))
    city = models.CharField(max_length=255, verbose_name=_('City'))
    country = models.ForeignKey(Country, on_delete=models.CASCADE, verbose_name=_('Country'))

    class Meta:
        verbose_name = _('Airport')
        verbose_name_plural = _('Airports')

    def __str__(self):
        return f"{self.name} ({self.code})"

class Flight(models.Model):
    airline = models.ForeignKey(Airline, on_delete=models.CASCADE, related_name='flights')
    flight_number = models.CharField(max_length=20, verbose_name=_('Flight Number'))
    
    origin = models.ForeignKey(Airport, on_delete=models.CASCADE, related_name='departures', verbose_name=_('Origin'))
    destination = models.ForeignKey(Airport, on_delete=models.CASCADE, related_name='arrivals', verbose_name=_('Destination'))
    
    departure_time = models.DateTimeField(verbose_name=_('Departure Time'))
    arrival_time = models.DateTimeField(verbose_name=_('Arrival Time'))
    
    price_economy = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_('Price Economy'))
    price_business = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_('Price Business'), null=True, blank=True)
    
    seats_economy = models.PositiveIntegerField(default=100)
    seats_business = models.PositiveIntegerField(default=20)
    
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = _('Flight')
        verbose_name_plural = _('Flights')
        ordering = ['departure_time']

    def __str__(self):
        return f"{self.flight_number}: {self.origin.code} -> {self.destination.code}"

class FlightBooking(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='flight_bookings')
    flight = models.ForeignKey(Flight, on_delete=models.CASCADE, related_name='bookings')
    
    passenger_name = models.CharField(max_length=255)
    passenger_passport = models.CharField(max_length=50)
    seat_class = models.CharField(max_length=20, choices=[('economy', 'Economy'), ('business', 'Business')], default='economy')
    
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='pending') # Changed default to pending
    is_paid = models.BooleanField(default=False)
    payment_method = models.CharField(max_length=50, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Flight Booking')
        verbose_name_plural = _('Flight Bookings')
