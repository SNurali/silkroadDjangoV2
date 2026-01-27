from rest_framework import serializers
from .models import Vendor
from locations.models import Region, District
from hotels.models import Hotel, Sight, Ticket, Category
from hotels.serializers import HotelSerializer, SightSerializer

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
        fields = ['id', 'name', 'status', 'joined_at', 'stats', 'balance']
        
    def get_status(self, obj):
        return 'Active' if obj.is_active else 'Inactive'
        
    def get_joined_at(self, obj):
        return obj.created_at

    def get_stats(self, obj):
        # Count hotels
        hotels_count = Hotel.objects.filter(vendor=obj).count()
        # Count sights
        sights_count = Sight.objects.filter(vendor=obj).count()
        # Count tickets/bookings (simple total for now)
        tickets_sold = Ticket.objects.filter(vendor=obj, is_paid=True).count()
        
        return {
            'hotels': hotels_count,
            'tours': sights_count,
            'bookings_today': 0, # Placeholder
            'total_bookings': tickets_sold
        }
        
    def get_balance(self, obj):
        # Calculate total revenue from tickets
        # Assuming we can sum(Ticket.total_amount)
        from django.db.models import Sum
        revenue = Ticket.objects.filter(vendor=obj, is_paid=True).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        return revenue

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

class VendorRegistrationSerializer(serializers.ModelSerializer):
    # Minimal registration serializer
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = Vendor
        fields = ['name', 'address', 'email', 'password', 'id_district', 'id_region', 'id_category']
        extra_kwargs = {
            'id_district': {'required': True},
            'id_region': {'required': True},
            'id_category': {'required': True}
        }
        
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
    company_name = serializers.CharField(source='name', required=False)
    bill_data = serializers.JSONField(required=False)
    attributes = serializers.JSONField(required=False)
    
    # Enterprise Legal Fields
    inn = serializers.CharField(required=False, allow_blank=True)
    mfo = serializers.CharField(required=False, allow_blank=True)
    checking_account = serializers.CharField(required=False, allow_blank=True)
    business_type = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Vendor
        fields = [
            'id', 'company_name', 'phone', 'email', 'full_name',
            'passport', 'dtb', 'sex', 'id_citizen',
            'bill_data', 'attributes',
            'inn', 'mfo', 'checking_account', 'business_type'
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
