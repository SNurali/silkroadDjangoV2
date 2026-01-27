# Append these serializers to vendors/serializers.py

from rest_framework import serializers
from .models import VendorService, ServiceTicket, TicketSale


class VendorServiceSerializer(serializers.ModelSerializer):
    """
    Serializer for VendorService model.
    """
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    total_tickets_sold = serializers.SerializerMethodField()
    total_revenue = serializers.SerializerMethodField()
    
    class Meta:
        model = VendorService
        fields = [
            'id', 'vendor', 'vendor_name', 'type', 'description', 
            'photos', 'schedule', 'has_tickets', 'is_active', 
            'created_at', 'total_tickets_sold', 'total_revenue'
        ]
        read_only_fields = ['id', 'vendor', 'created_at']
    
    def get_total_tickets_sold(self, obj):
        return TicketSale.objects.filter(
            ticket_type__service=obj,
            status='PAID'
        ).count()
    
    def get_total_revenue(self, obj):
        from django.db.models import Sum
        total = TicketSale.objects.filter(
            ticket_type__service=obj,
            status='PAID'
        ).aggregate(total=Sum('price_paid'))['total']
        return float(total) if total else 0.0


class ServiceTicketSerializer(serializers.ModelSerializer):
    """
    Serializer for ServiceTicket model.
    """
    service_name = serializers.CharField(source='service.type', read_only=True)
    tickets_sold = serializers.SerializerMethodField()
    
    class Meta:
        model = ServiceTicket
        fields = [
            'id', 'service', 'service_name', 
            'weekday_price', 'weekend_price', 
            'resident_price', 'non_resident_price',
            'max_tickets', 'validity_period', 
            'created_at', 'tickets_sold'
        ]
        read_only_fields = ['id', 'service', 'created_at']
    
    def get_tickets_sold(self, obj):
        return TicketSale.objects.filter(ticket_type=obj).count()


class TicketSaleSerializer(serializers.ModelSerializer):
    """
    Serializer for TicketSale model.
    """
    service_name = serializers.CharField(source='ticket_type.service.type', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    currency_code = serializers.CharField(source='currency.code', read_only=True)
    
    class Meta:
        model = TicketSale
        fields = [
            'id', 'ticket_type', 'service_name', 
            'user', 'user_name', 'user_email',
            'purchase_date', 'status', 'price_paid', 
            'currency', 'currency_code', 'qr_code'
        ]
        read_only_fields = ['id', 'purchase_date', 'qr_code']


class VendorDashboardStatsSerializer(serializers.Serializer):
    """
    Serializer for vendor dashboard statistics.
    """
    total_services = serializers.IntegerField()
    total_tickets_sold = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    vendor_role = serializers.CharField()
