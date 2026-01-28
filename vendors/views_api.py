from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Sum, Count, F, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta

from .models import Vendor, VendorUserRole
from .serializers import VendorRegistrationSerializer, VendorDashboardStatsSerializer, VendorApplySerializer

# ... existing views ...

class VendorApplyView(APIView):
    """
    Endpoint for users to apply for a vendor account.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        serializer = VendorApplySerializer(data=request.data)
        if serializer.is_valid():
            vendor = serializer.save(status='PENDING', entry_by=request.user)
            # Link applying user as OWNER (status is PENDING, so they can't switch context yet)
            VendorUserRole.objects.create(user=request.user, vendor=vendor, role='OWNER')
            return Response(
                {'success': True, 'vendor_id': vendor.id, 'message': 'Application submitted for moderation.'},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VendorApproveView(APIView):
    """
    Admin endpoint to approve a vendor application.
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, vendor_id):
        try:
            vendor = Vendor.objects.get(id=vendor_id, status='PENDING')
        except Vendor.DoesNotExist:
            return Response({'error': 'Pending vendor not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        vendor.status = 'ACTIVE'
        vendor.save()
        return Response({'success': True, 'message': 'Vendor approved and activated.'})


class VendorRejectView(APIView):
    """
    Admin endpoint to reject a vendor application.
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, vendor_id):
        try:
            vendor = Vendor.objects.get(id=vendor_id, status='PENDING')
        except Vendor.DoesNotExist:
            return Response({'error': 'Pending vendor not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        reason = request.data.get('reason', 'No reason provided.')
        vendor.status = 'SUSPENDED'
        vendor.save()
        # Log rejection reason or send notification here
        return Response({'success': True, 'message': 'Vendor application rejected.'})
from hotels.models import Sight, Category
from bookings.models import Booking
from .models import TicketSale
from hotels.serializers import CategorySerializer
from rest_framework.serializers import ModelSerializer

# Placeholder or define Serializers if they are removed from hotels
class ExtraServiceSerializer(ModelSerializer):
    class Meta:
        fields = '__all__'

class RequiredConditionSerializer(ModelSerializer):
    class Meta:
        fields = '__all__'

class ReferenceView(APIView):
    """
    Returns common reference data: Categories, Extra Services, Required Conditions, Regions.
    """
    def get(self, request):
        from locations.models import Region, District
        from locations.serializers import RegionSerializer
        
        return Response({
            'categories': CategorySerializer(Category.objects.all(), many=True).data,
            'extra_services': ExtraServiceSerializer(ExtraService.objects.all(), many=True).data,
            'required_conditions': RequiredConditionSerializer(RequiredCondition.objects.all(), many=True).data,
            'regions': RegionSerializer(Region.objects.all(), many=True).data,
        })

class VendorRegistrationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = VendorRegistrationSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            vendor = serializer.save()
            return Response({'success': True, 'vendor_id': vendor.id}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VendorCategoryCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from hotels.serializers import CategorySerializer
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            category = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VendorStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        vendor = request.vendor
        if not vendor:
             return Response({'error': 'No active vendor context.'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Stats Counters
        sights_count = Sight.objects.filter(vendor=vendor).count()
        
        total_revenue_tickets = TicketSale.objects.filter(vendor=vendor, payment_status='paid')\
            .aggregate(total=Sum('total_amount'))['total'] or 0
        
        total_revenue_hotels = Booking.objects.filter(hotel__vendor=vendor, status='CONFIRMED')\
            .aggregate(total=Sum('total_price'))['total'] or 0
            
        total_revenue = total_revenue_tickets + total_revenue_hotels
            
        tickets_count = TicketSale.objects.filter(vendor=vendor).count()
        visitors_count = tickets_count # Simplified
        
        # 2. Chart Data (Last 30 Days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        daily_revenue = TicketSale.objects.filter(
            vendor=vendor, 
            payment_status='paid',
            created_at__gte=thirty_days_ago
        ).annotate(date=TruncDate('created_at'))\
         .values('date')\
         .annotate(y=Sum('total_amount'))\
         .order_by('date')
         
        chart_data = [{'x': item['date'].isoformat(), 'y': float(item['y'])} for item in daily_revenue]
        
        # 3. Recent Bookings
        recent_bookings_qs = Booking.objects.filter(
            hotel__vendor=vendor
        ).order_by('-created_at')[:5]
        recent_bookings = []
        for b in recent_bookings_qs:
            recent_bookings.append({
                'id': b.id,
                'user': "Guest",
                'amount': b.total_price,
                'date': b.created_at,
                'is_paid': b.status == 'CONFIRMED'
            })

        # Ticket Status for Donut Chart
        ticket_stats = {
            'paid': TicketSale.objects.filter(vendor=vendor, payment_status='paid').count(),
            'unpaid': TicketSale.objects.filter(vendor=vendor, payment_status='pending').count(),
            'valid': TicketSale.objects.filter(vendor=vendor, payment_status='paid').count(),
            'expired': 0,
        }

        data = {
            'items_count': sights_count,
            'tickets_count': tickets_count,
            'total_revenue': float(total_revenue),
            'visitors_count': visitors_count,
            'recentBookings': recent_bookings,
            'chartData': chart_data,
            'ticketStatus': ticket_stats
        }
        
        return Response(data)
