from rest_framework import viewsets
from .models import Cab, CabBooking
from .serializers import CabSerializer, CabBookingSerializer
from rest_framework.permissions import AllowAny

class CabViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Cab.objects.all()
    serializer_class = CabSerializer
    permission_classes = [AllowAny]

class CabBookingViewSet(viewsets.ModelViewSet):
    queryset = CabBooking.objects.all()
    serializer_class = CabBookingSerializer
    permission_classes = [AllowAny] # Open for demo, normally IsAuthenticated
