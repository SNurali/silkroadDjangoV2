from rest_framework import serializers
from .models import Airline, Airport, Flight, FlightBooking

class AirlineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Airline
        fields = ['id', 'name', 'code', 'logo']

class AirportSerializer(serializers.ModelSerializer):
    country_name = serializers.CharField(source='country.name', read_only=True)
    
    class Meta:
        model = Airport
        fields = ['id', 'name', 'code', 'city', 'country', 'country_name']

class FlightSerializer(serializers.ModelSerializer):
    airline = AirlineSerializer(read_only=True)
    origin = AirportSerializer(read_only=True)
    destination = AirportSerializer(read_only=True)
    
    # Duration (computed)
    duration = serializers.SerializerMethodField()
    
    class Meta:
        model = Flight
        fields = [
            'id', 'airline', 'flight_number', 
            'origin', 'destination', 
            'departure_time', 'arrival_time', 'duration',
            'price_economy', 'price_business', 
            'seats_economy', 'seats_business'
        ]

    def get_duration(self, obj):
        diff = obj.arrival_time - obj.departure_time
        hours = diff.seconds // 3600
        minutes = (diff.seconds % 3600) // 60
        return f"{hours}h {minutes}m"

class FlightBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = FlightBooking
        fields = '__all__'
        read_only_fields = ['user', 'total_price', 'status', 'is_paid', 'created_at']
