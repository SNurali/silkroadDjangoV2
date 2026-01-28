from rest_framework import serializers
from .models import Booking, BookingStatusHistory
from hotels.serializers import HotelSerializer, RoomTypeSerializer

class BookingSerializer(serializers.ModelSerializer):
    hotel_details = HotelSerializer(source='hotel', read_only=True)
    room_details = RoomTypeSerializer(source='room_type', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'hotel', 'hotel_details', 'room_type', 'room_details',
            'check_in', 'check_out', 'adults', 'children', 'status',
            'emehmon_id', 'total_price', 'currency', 'created_at', 'updated_at'
        ]
        read_only_fields = ['status', 'emehmon_id', 'created_at']

class BookingStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingStatusHistory
        fields = '__all__'
