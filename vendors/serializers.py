from rest_framework import serializers
from .models import Vendor
from locations.models import Region, District
from hotels.models import Hotel, Sight, Category
from hotels.serializers import HotelSerializer, SightSerializer
from bookings.models import Booking
from .models import TicketSale

class VendorDashboardSerializer(serializers.ModelSerializer):
    """
    Serializer to expose Vendor profile + basic stats.
    """
    stats = serializers.SerializerMethodField()
    balance = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    joined_at = serializers.SerializerMethodField()
    
    class Meta:
        model = Vendor
        fields = ['id', 'brand_name', 'legal_name', 'status', 'joined_at', 'stats', 'balance']
        
    def get_status(self, obj):
        return obj.status
        
    def get_joined_at(self, obj):
        return obj.created_at

    def get_brand_name(self, obj):
        return obj.brand_name

    def get_stats(self, obj):
        # Count hotels
        hotels_count = Hotel.objects.filter(vendor=obj).count()
        # Count sights
        sights_count = Sight.objects.filter(vendor=obj).count()
        # Count tickets/bookings (simple total for now)
        tickets_sold = TicketSale.objects.filter(vendor=obj, payment_status='paid').count()
        bookings_count = Booking.objects.filter(hotel__vendor=obj, status='CONFIRMED').count()
        
        return {
            'hotels': hotels_count,
            'tours': sights_count,
            'bookings_today': 0, # Placeholder
            'total_bookings': tickets_sold + bookings_count
        }
        
        # Calculate total revenue from tickets and bookings
        from django.db.models import Sum
        ticket_revenue = TicketSale.objects.filter(vendor=obj, payment_status='paid').aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        booking_revenue = Booking.objects.filter(hotel__vendor=obj, status='CONFIRMED').aggregate(Sum('total_price'))['total_price__sum'] or 0
        return ticket_revenue + booking_revenue

class VendorHotelSerializer(HotelSerializer):
    """
    Serializer for Vendors to manage their Hotels.
    Extended from Public serializer, maybe with more fields editable.
    """
    class Meta(HotelSerializer.Meta):
        fields = [
            'id', 'name', 'stars', 'description', 'address', 'geolocation',
            'images', 'images_read',
            'region', 'region_id',
            'deposit', 'deposit_turizm',
            'amenities_services',
            'created_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at', 'rating', 'created_by', 'vendor', 'region')
        extra_kwargs = {
            'region_id': {'required': True, 'source': 'region'},
        }

    images = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        write_only=True
    )
    images_read = serializers.SerializerMethodField(read_only=True)
    region_id = serializers.PrimaryKeyRelatedField(
        queryset=Region.objects.all(), source='region'
    )

    def get_images_read(self, obj):
        return obj.get_images_list()

    def create(self, validated_data):
        # Handle images list -> string
        images_list = validated_data.pop('images', [])
        if isinstance(images_list, list):
            validated_data['images'] = ','.join(images_list)
        
        # Ensure JSON defaults
        validated_data.setdefault('amenities_services', {})
        
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Handle images list -> string
        if 'images' in validated_data:
            images_list = validated_data.pop('images')
            if isinstance(images_list, list):
                instance.images = ','.join(images_list)
        
        return super().update(instance, validated_data)

class VendorSightSerializer(SightSerializer):
    """
    Serializer for Vendors to manage their Tours/Sights.
    """
    # Override fields to ensure they are writable and have correct types
    images = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        write_only=True
    )
    images_read = serializers.SerializerMethodField(read_only=True)
    
    opening_times = serializers.JSONField(required=False)
    extra_services = serializers.JSONField(required=False)
    required_conditions = serializers.JSONField(required=False)
    
    # Pricing checks
    is_local = serializers.DecimalField(max_digits=12, decimal_places=2, required=True)
    is_foreg = serializers.DecimalField(max_digits=12, decimal_places=2, required=True)
    
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category'
    )
    region_id = serializers.PrimaryKeyRelatedField(
        queryset=Region.objects.all(), source='region'
    )
    district_id = serializers.PrimaryKeyRelatedField(
        queryset=District.objects.all(), source='district'
    )
    
    class Meta(SightSerializer.Meta):
        fields = [
            'id', 'category', 'category_id', 'name', 'description', 'sh_description',
            'region', 'region_id', 'district', 'district_id', 'address', 'geolocation',
            'images', 'images_read',
            'is_local', 'is_foreg', 'max_capacity',
            'opening_times', 'extra_services', 'required_conditions',
            'created_at', 'status', 'enable_tickets'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at', 'status', 'created_by', 'vendor', 'category', 'region', 'district')
        extra_kwargs = {
            # Removed manual overrides as they are now explicit fields
        }

    def get_images_read(self, obj):
        return obj.get_images_list()

    def create(self, validated_data):
        # Handle images list -> string
        images_list = validated_data.pop('images', [])
        if isinstance(images_list, list):
            validated_data['images'] = ','.join(images_list)
        
        # Handle JSON defaults if missing
        validated_data.setdefault('opening_times', {})
        validated_data.setdefault('extra_services', {})
        validated_data.setdefault('required_conditions', {})
        
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Handle images list -> string
        if 'images' in validated_data:
            images_list = validated_data.pop('images')
            if isinstance(images_list, list):
                instance.images = ','.join(images_list)
        
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Ensure images field is present in response as a list
        ret['images'] = instance.get_images_list()
        return ret


# --------------------------------------------------------------------------
# Legacy / Registration Serializers (Restored)
# --------------------------------------------------------------------------

class VendorApplySerializer(serializers.ModelSerializer):
    """
    Serializer for new vendor applications.
    """
    class Meta:
        model = Vendor
        fields = [
            'brand_name', 'legal_name', 'tax_id', 'contact_email', 
            'phone', 'address', 'business_type', 'mfo', 
            'checking_account', 'bank_name', 'oked', 'certificate_image'
        ]

    def validate_tax_id(self, value):
        if Vendor.objects.filter(tax_id=value).exists():
            raise serializers.ValidationError("A vendor with this Tax ID already exists.")
        return value

class VendorRegistrationSerializer(serializers.ModelSerializer):
    # Minimal registration serializer
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = Vendor
        fields = ['brand_name', 'address', 'email', 'password', 'id_district', 'id_region', 'id_category']
        # Note: id_ fields might need adjustment if they were using legacy naming in models
        
    def create(self, validated_data):
        # This logic should be in View or Service usually, mimicking legacy logic if simple
        return Vendor.objects.create(**validated_data)

class VendorDashboardStatsSerializer(serializers.Serializer):
    # Legacy stats if different from new one
    total_sales = serializers.DecimalField(max_digits=12, decimal_places=2)
    bookings_count = serializers.IntegerField()

class VendorSettingsSerializer(serializers.ModelSerializer):
    """
    Serializer for handling Vendor Settings updates (Profile, Payment, Notifications).
    Updates both Vendor model and linked User model.
    """
    # User fields
    email = serializers.EmailField(source='user.email', read_only=True) # Email usually read-only or handled separately
    phone = serializers.CharField(source='user.phone', required=False)
    full_name = serializers.CharField(source='user.name', required=False)
    # Profile extras
    passport = serializers.CharField(source='user.passport', required=False, allow_blank=True)
    dtb = serializers.DateField(source='user.dtb', required=False, allow_null=True)
    sex = serializers.CharField(source='user.sex', required=False, allow_blank=True)
    id_citizen = serializers.IntegerField(source='user.id_citizen', required=False, allow_null=True)
    
    # Vendor fields
    brand_name = serializers.CharField(source='brand_name', required=False)
    legal_name = serializers.CharField(source='legal_name', required=False)
    bill_data = serializers.JSONField(required=False)
    attributes = serializers.JSONField(required=False)
    
    # Enterprise Legal Fields
    tax_id = serializers.CharField(required=False, allow_blank=True)
    mfo = serializers.CharField(required=False, allow_blank=True)
    checking_account = serializers.CharField(required=False, allow_blank=True)
    business_type = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Vendor
        fields = [
            'id', 'brand_name', 'legal_name', 'phone', 'email', 'full_name',
            'passport', 'dtb', 'sex', 'id_citizen',
            'bill_data', 'attributes',
            'tax_id', 'mfo', 'checking_account', 'business_type',
            'oked', 'bank_name'
        ]
        read_only_fields = ['email']

    def update(self, instance, validated_data):
        # Extract user data
        user_data = validated_data.pop('user', {})
        
        # Update Vendor fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update User fields
        if instance.user:
            user = instance.user
            for attr, value in user_data.items():
                setattr(user, attr, value)
            user.save()
            
        return instance
