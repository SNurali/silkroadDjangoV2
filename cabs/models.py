from django.db import models

class Cab(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, help_text="Unique identifier like 'std_sedan'")
    price = models.DecimalField(max_digits=12, decimal_places=0, verbose_name="Price (UZS)")
    capacity = models.CharField(max_length=50, help_text="e.g. '3 Guests'")
    rating = models.FloatField(default=5.0)
    image = models.ImageField(upload_to='cabs/', blank=True, null=True)
    features = models.JSONField(default=list, help_text="List of features e.g. ['AC', 'WiFi']")
    
    # Ordering
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name

class CabBooking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    cab = models.ForeignKey(Cab, on_delete=models.CASCADE, related_name='bookings')
    passenger_name = models.CharField(max_length=100)
    passenger_phone = models.CharField(max_length=20)
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    pickup_datetime = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.passenger_name} - {self.cab.name}"
