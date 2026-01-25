from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CabViewSet, CabBookingViewSet

router = DefaultRouter()
router.register(r'bookings', CabBookingViewSet)
router.register(r'', CabViewSet)  # Registers at /api/cabs/

urlpatterns = [
    path('', include(router.urls)),
]
