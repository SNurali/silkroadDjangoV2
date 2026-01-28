from django.utils import timezone
from rest_framework import serializers

from accounts.models import User
from .models import Sight, Category, SightFacility, Hotel, Room, RoomType, RoomPrice, HotelComment
from captcha.fields import CaptchaField


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





class GuestSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    passport = serializers.CharField(max_length=50)
    citizen = serializers.IntegerField(help_text="Country ID (173 for Uzbekistan)")


class TicketCreateSerializer(serializers.Serializer):
    sight_id = serializers.IntegerField()
    tour_date = serializers.DateField(required=False, default=timezone.now().date)
    guests = GuestSerializer(many=True)

    def validate_sight_id(self, value):
        if not Sight.objects.filter(id=value).exists():
            raise serializers.ValidationError("Sight not found.")
        return value

    def validate_guests(self, value):
        if not value:
            raise serializers.ValidationError("At least one guest is required.")
        return value





class HotelCommentSerializer(serializers.ModelSerializer):
    """
    Serializer for Hotel Comments/Reviews with CAPTCHA validation.
    """
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    captcha = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = HotelComment
        fields = (
            'id',
            'hotel',
            'user',
            'user_name',
            'user_email',
            'rating',
            'comment',
            'status',
            'created_at',
            'updated_at',
            'captcha',
        )
        read_only_fields = ('id', 'user', 'user_name', 'user_email', 'status', 'created_at', 'updated_at')

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate_comment(self, value):
        if len(value) < 10:
            raise serializers.ValidationError("Comment must be at least 10 characters long.")
        if len(value) > 1000:
            raise serializers.ValidationError("Comment cannot exceed 1000 characters.")
        return value
    
    def validate_captcha(self, value):
        """Validate CAPTCHA field format: key:code"""
        if ':' not in value:
            raise serializers.ValidationError("Invalid CAPTCHA format. Expected 'key:code'")
        
        captcha_key, captcha_code = value.split(':', 1)
        
        # Use django-simple-captcha's built-in validation
        from captcha.models import CaptchaStore
        from django.utils import timezone
        from datetime import timedelta
        
        try:
            # Check if captcha exists and is valid
            captcha = CaptchaStore.objects.get(
                hashkey=captcha_key,
                response=captcha_code,
                expiration__gt=timezone.now()
            )
            # Delete after successful validation (one-time use)
            captcha.delete()
            return value
        except CaptchaStore.DoesNotExist:
            raise serializers.ValidationError("Invalid or expired CAPTCHA code")