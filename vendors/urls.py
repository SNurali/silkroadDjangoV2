from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    VendorDashboardView, VendorHotelViewSet, VendorSightViewSet, VendorSettingsView, 
    VendorBookingViewSet, VendorTicketViewSet
)
from .views_api import VendorRegistrationView, VendorStatsView, ReferenceView, VendorCategoryCreateView

router = DefaultRouter()
router.register(r'hotels', VendorHotelViewSet, basename='vendor-hotels')
router.register(r'tours', VendorSightViewSet, basename='vendor-tours')
router.register(r'bookings', VendorBookingViewSet, basename='vendor-bookings')
router.register(r'tickets', VendorTicketViewSet, basename='vendor-tickets')

urlpatterns = [
    path('register/', VendorRegistrationView.as_view(), name='vendor-register'),
    path('dashboard/', VendorDashboardView.as_view(), name='vendor-dashboard'),
    path('settings/', VendorSettingsView.as_view(), name='vendor-settings'),
    path('stats/', VendorStatsView.as_view(), name='vendor-stats'),
    path('references/', ReferenceView.as_view(), name='vendor-references'),
    path('categories/', VendorCategoryCreateView.as_view(), name='vendor-category-create'),
    path('upload-image/', VendorSightViewSet.as_view({'post': 'upload_image'}), name='vendor-upload-image'),
    path('', include(router.urls)),
]
