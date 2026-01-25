from rest_framework import serializers
from .models import Cab, CabBooking

class CabSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cab
        fields = ['id', 'name', 'slug', 'price', 'capacity', 'rating', 'image', 'features']

class CabBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = CabBooking
        fields = '__all__'
        read_only_fields = ['status', 'created_at']
