from rest_framework import viewsets, generics, filters, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.conf import settings
from django.shortcuts import get_object_or_404
import datetime

from .models import Airline, Airport, Flight, FlightBooking
from .serializers import AirlineSerializer, AirportSerializer, FlightSerializer, FlightBookingSerializer

class FlightViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API for searching and listing flights.
    """
    queryset = Flight.objects.filter(is_active=True).select_related('airline', 'origin', 'destination')
    serializer_class = FlightSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    ordering_fields = ['price_economy', 'departure_time', 'duration']

    def get_queryset(self):
        qs = super().get_queryset()
        
        # 1. Date Filtering
        date_str = self.request.query_params.get('date')
        if date_str:
            try:
                # Accept YYYY-MM-DD
                date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
                qs = qs.filter(departure_time__date=date)
            except ValueError:
                pass 
        
        # 2. Origin Filtering (Code or City Name or ID)
        origin = self.request.query_params.get('origin')
        if origin:
            qs = qs.filter(
                Q(origin__code__iexact=origin) | 
                Q(origin__city__icontains=origin) |
                Q(origin__name__icontains=origin) |
                Q(origin__country__name__icontains=origin)
            )

        # 3. Destination Filtering
        dest = self.request.query_params.get('destination')
        if dest:
            qs = qs.filter(
                Q(destination__code__iexact=dest) | 
                Q(destination__city__icontains=dest) |
                Q(destination__name__icontains=dest) |
                Q(destination__country__name__icontains=dest)
            )
            
        return qs.order_by('departure_time')

class AirportListView(generics.ListAPIView):
    """
    List airports for dropdowns.
    """
    queryset = Airport.objects.all().order_by('city')
    serializer_class = AirportSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None 
    
    def get_queryset(self):
        qs = super().get_queryset()
        query = self.request.query_params.get('q')
        if query:
            qs = qs.filter(
                Q(name__icontains=query) | 
                Q(code__icontains=query) | 
                Q(city__icontains=query) |
                Q(country__name__icontains=query)
            )
        return qs[:20] # Limit results

class BookingViewSet(viewsets.ModelViewSet):
    queryset = FlightBooking.objects.all()
    serializer_class = FlightBookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Calculate total price based on seat class
        flight = serializer.validated_data['flight']
        seat_class = serializer.validated_data.get('seat_class', 'economy')
        
        price = flight.price_economy
        if seat_class == 'business' and flight.price_business:
            price = flight.price_business
            
        serializer.save(
            user=self.request.user,
            total_price=price,
            status='pending' # Changed from 'confirmed' to 'pending' as default for new flow
        )

    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        booking = self.get_object()
        if booking.is_paid:
            return Response({"detail": "Booking already paid"}, status=status.HTTP_400_BAD_REQUEST)

        # Fake payment logic
        if getattr(settings, 'FAKE_PAYMENT', True):
            booking.is_paid = True
            booking.status = 'confirmed'
            booking.save(update_fields=['is_paid', 'status'])
            return Response({
                "success": True,
                "message": "Payment successful (Test Mode)",
                "booking": FlightBookingSerializer(booking).data
            })
        
        return Response({"detail": "Real payment not implemented"}, status=status.HTTP_501_NOT_IMPLEMENTED)

    def get_queryset(self):
        return FlightBooking.objects.filter(user=self.request.user)
