from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FlightViewSet, AirportListView, BookingViewSet

router = DefaultRouter()
router.register(r'search', FlightViewSet, basename='flight-search')
router.register(r'bookings', BookingViewSet, basename='flight-bookings')

urlpatterns = [
    path('airports/', AirportListView.as_view(), name='airport-list'),
    path('', include(router.urls)),
]
