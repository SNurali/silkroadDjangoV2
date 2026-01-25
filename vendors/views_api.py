from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db.models import Sum, Count, F
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta

from .models import Vendor
from .serializers import VendorRegistrationSerializer, VendorDashboardStatsSerializer
from hotels.models import Sight, TicketDetail, Booking, ExtraService, RequiredCondition, Category
from hotels.serializers import CategorySerializer
from rest_framework.serializers import ModelSerializer

class ExtraServiceSerializer(ModelSerializer):
    class Meta:
        model = ExtraService
        fields = '__all__'

class RequiredConditionSerializer(ModelSerializer):
    class Meta:
        model = RequiredCondition
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
        try:
            vendor = Vendor.objects.get(user=request.user)
        except Vendor.DoesNotExist:
             return Response({'error': 'Vendor profile not found'}, status=status.HTTP_404_NOT_FOUND)

        # 1. Stats Counters
        # In legacy, 'sights' are linked to vendor via id_vendor
        sights_count = Sight.objects.filter(vendor=vendor).count()
        
        # Tickets -> linked to sights -> linked to vendor
        # But wait, Ticket model directly has 'vendor' FK.
        # TicketDetail has 'amount' and 'status'.
        
        # Total Revenue: Sum of TicketDetail amounts for this vendor
        # Note: TicketDetail doesn't have direct vendor FK, but Ticket does.
        # Legacy Show.blade.php uses `tb_ticket_details.where('id_vendor', $id)` which suggests details MIGHT have it,
        # OR it joins via Ticket. My TicketDetail model doesn't have vendor, but Ticket does.
        # Let's filter Tickets by vendor, then sum their details.
        
        # Actually, let's look at `hotels/models.py`. Ticket has vendor.
        total_revenue = TicketDetail.objects.filter(ticket__vendor=vendor, status='used')\
            .aggregate(total=Sum('amount'))['total'] or 0
            
        tickets_count = TicketDetail.objects.filter(ticket__vendor=vendor).count()
        visitors_count = tickets_count # Simplified
        
        # 2. Chart Data (Last 30 Days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        daily_revenue = TicketDetail.objects.filter(
            ticket__vendor=vendor, 
            status='used',
            created_at__gte=thirty_days_ago
        ).annotate(date=TruncDate('created_at'))\
         .values('date')\
         .annotate(y=Sum('amount'))\
         .order_by('date')
         
        chart_data = [{'x': item['date'].isoformat(), 'y': float(item['y'])} for item in daily_revenue]
        
        # 3. Recent Bookings (Bookings for this vendor's hotel)
        # Note: Booking model has `hotel`. Hotel might be linked to vendor?
        # My Vendor model has no direct link to Hotel, but Hotel likely has `created_by` user?
        # Or Hotel might have a `vendor` FK if I added it?
        # `hotels/models.py`: Sight has `vendor`. Hotel (legacy) has `created_by`.
        # Assuming for now we are using Sights logic primarily.
        
        recent_bookings_qs = Booking.objects.filter(hotel__created_by=request.user).order_by('-created_at')[:5]
        recent_bookings = []
        for b in recent_bookings_qs:
            recent_bookings.append({
                'id': b.id,
                'user': b.guest_name,
                'amount': b.total_price,
                'date': b.created_at,
                'is_paid': b.payment_status == 'paid'
            })

        # Ticket Status for Donut Chart
        ticket_stats = {
            'paid': TicketDetail.objects.filter(ticket__vendor=vendor, status='used').count(),
            'unpaid': TicketDetail.objects.filter(ticket__vendor=vendor, status='active').count(), # simplification
            'valid': TicketDetail.objects.filter(ticket__vendor=vendor, status='active').count(),
            'expired': TicketDetail.objects.filter(ticket__vendor=vendor, status='expired').count(),
        }

        data = {
            'items_count': sights_count,
            'tickets_count': tickets_count,
            'total_revenue': total_revenue,
            'visitors_count': visitors_count,
            'recentBookings': recent_bookings,
            'chartData': chart_data,
            'ticketStatus': ticket_stats
        }
        
        return Response(data)
