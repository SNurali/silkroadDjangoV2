from rest_framework import serializers

from accounts.models import User
from .models import Sight, Category, SightFacility, Ticket, Hotel, Room, RoomType, RoomPrice, Booking, TicketDetail


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'photo')


class SightFacilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = SightFacility
        fields = ('id', 'name', 'icon')


class UserSerializer(serializers.ModelSerializer):
    """
    Минимальный сериализатор пользователя.
    """
    class Meta:
        model = User
        fields = ('id', 'email', 'name')
        read_only_fields = fields


class SightSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    facilities = SightFacilitySerializer(many=True, read_only=True)

    gallery_images = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()

    class Meta:
        model = Sight
        fields = (
            'id',
            'name',
            'name_ru',
            'name_uz',
            'sh_description',
            'sh_description_ru',
            'sh_description_uz',
            'description',
            'description_ru',
            'description_uz',
            'address',
            'geolocation',
            'images',
            'gallery_images',
            'image',
            'price',
            'status',
            'is_foreg',
            'is_local',
            'max_capacity',
            'opening_times',
            'extra_services',
            'required_conditions',
            'amenities_services',
            'safety',
            'payment_methods',
            'staff_languages',
            'activities',
            'enable_tickets',
            'category',
            'facilities',
            'created_at',
        )
        read_only_fields = (
            'id',
            'status',
            'created_at',
        )

    def get_gallery_images(self, obj):
        return obj.get_images_list()

    def get_image(self, obj):
        images = obj.get_images_list()
        if images:
            return images[0]
        return None

    def get_price(self, obj):
        return obj.is_foreg or 0


class HotelSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели Hotel (legacy + new).
    """
    region = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()

    class Meta:
        model = Hotel
        fields = [
            'id', 'name', 'region', 'address', 'stars', 'rating',
            'description', 'images', 'price', 'amenities_services',
            'geolocation',
            'created_at'
        ]

    def get_region(self, obj):
        return obj.region.name if obj.region else None

    def get_images(self, obj):
        return obj.get_images_list()
    
    def get_price(self, obj):
        # Prefer annotated price (from filters)
        if hasattr(obj, 'price'):
            return obj.price
        # Fallback to DB fields
        return obj.deposit or obj.deposit_turizm or 0


class TicketSerializer(serializers.ModelSerializer):
    sight = SightSerializer(read_only=True)
    user = UserSerializer(read_only=True, source='created_by')

    class Meta:
        model = Ticket
        fields = (
            'id',
            'sight',
            'total_qty',
            'total_amount',
            'is_paid',
            'is_valid',
            'created_at',
            'user',
        )
        read_only_fields = (
            'id',
            'total_amount',
            'is_paid',
            'is_valid',
            'created_at',
            'user',
        )


class RoomTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomType
        fields = '__all__'


class RoomPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomPrice
        fields = '__all__'


class RoomSerializer(serializers.ModelSerializer):
    room_type = RoomTypeSerializer(read_only=True)
    prices = RoomPriceSerializer(many=True, read_only=True)

    class Meta:
        model = Room
        fields = '__all__'


class BookingSerializer(serializers.ModelSerializer):
    hotel_name = serializers.CharField(source='hotel.name', read_only=True)
    
    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')


class GuestSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    passport = serializers.CharField(max_length=50)
    citizen = serializers.IntegerField(help_text="Country ID (173 for Uzbekistan)")


class TicketCreateSerializer(serializers.Serializer):
    sight_id = serializers.IntegerField()
    guests = GuestSerializer(many=True)

    def validate_sight_id(self, value):
        if not Sight.objects.filter(id=value).exists():
            raise serializers.ValidationError("Sight not found.")
        return value

    def validate_guests(self, value):
        if not value:
            raise serializers.ValidationError("At least one guest is required.")
        return value


class TicketDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketDetail # Make sure TicketDetail is imported
        fields = '__all__'