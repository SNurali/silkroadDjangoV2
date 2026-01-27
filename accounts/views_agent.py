from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db.models import Count, Sum
from hotels.serializers import BookingSerializer
from hotels.models import Booking, Ticket
from vendors.models import Vendor

class AgentDashboardAPIView(APIView):
    """
    Dashboard for Agents (B2B).
    Provides stats on bookings and tickets created by this agent.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if request.user.role != 'agent':
            return Response({"error": "Only agents can access this dashboard"}, status=status.HTTP_403_FORBIDDEN)
            
        # Stats
        total_bookings = Booking.objects.filter(created_by=request.user).count()
        active_bookings = Booking.objects.filter(created_by=request.user, booking_status='confirmed').count()
        total_tickets = Ticket.objects.filter(created_by=request.user).count()
        
        # Revenue/Total Spend (If applicable)
        total_spent = Booking.objects.filter(created_by=request.user, booking_status='confirmed').aggregate(Sum('total_price'))['total_price__sum'] or 0
        
        return Response({
            'stats': {
                'total_bookings': total_bookings,
                'active_bookings': active_bookings,
                'total_tickets': total_tickets,
                'total_spent': total_spent,
            },
            'recent_bookings': BookingSerializer(Booking.objects.filter(created_by=request.user).order_by('-created_at')[:5], many=True).data,
        })
