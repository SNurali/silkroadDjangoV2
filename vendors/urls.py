from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    VendorDashboardView, VendorHotelViewSet, VendorSightViewSet, VendorSettingsView, 
    VendorBookingViewSet, VendorTicketViewSet, VendorSwitchView, UserSwitchView  # Add new views
)
from .views_api import (
    VendorRegistrationView, VendorStatsView, ReferenceView, 
    VendorCategoryCreateView, VendorApplyView, VendorApproveView, VendorRejectView
)
from .views_auth import SwitchToVendorContextView, SwitchToUserContextView, VendorListView
from .views_vendor_api import (
    VendorDashboardStatsView, VendorServiceListCreateView, VendorServiceDetailView,
    ServiceTicketListCreateView, TicketSaleListView, SalesAnalyticsView
)

router = DefaultRouter()
router.register(r'hotels', VendorHotelViewSet, basename='vendor-hotels')
router.register(r'tours', VendorSightViewSet, basename='vendor-tours')
router.register(r'bookings', VendorBookingViewSet, basename='vendor-bookings')
router.register(r'tickets', VendorTicketViewSet, basename='vendor-tickets')

urlpatterns = [
    # Legacy endpoints
    path('register/', VendorRegistrationView.as_view(), name='vendor-register'),
    path('dashboard/', VendorDashboardView.as_view(), name='vendor-dashboard'),
    path('settings/', VendorSettingsView.as_view(), name='vendor-settings'),
    path('stats/', VendorStatsView.as_view(), name='vendor-stats'),
    path('references/', ReferenceView.as_view(), name='vendor-references'),
    path('categories/', VendorCategoryCreateView.as_view(), name='vendor-category-create'),
    path('upload-image/', VendorSightViewSet.as_view({'post': 'upload_image'}), name='vendor-upload-image'),
    
    # Role switching endpoints
    path('switch-to-vendor/<int:vendor_id>/', VendorSwitchView.as_view(), name='vendor-switch-to-vendor'),
    path('switch-to-user/', UserSwitchView.as_view(), name='vendor-switch-to-user'),
    path('my-vendors/', VendorListView.as_view(), name='vendor-my-vendors'),
    path('switch-context/to-vendor/<int:vendor_id>/', SwitchToVendorContextView.as_view(), name='vendor-switch-context-to-vendor'),
    path('switch-context/to-user/', SwitchToUserContextView.as_view(), name='vendor-switch-context-to-user'),
    
    # Apply & Moderation
    path('apply/', VendorApplyView.as_view(), name='vendor-apply'),
    path('admin/<int:vendor_id>/approve/', VendorApproveView.as_view(), name='vendor-approve'),
    path('admin/<int:vendor_id>/reject/', VendorRejectView.as_view(), name='vendor-reject'),
    
    # New enterprise endpoints
    path('dashboard-stats/', VendorDashboardStatsView.as_view(), name='vendor-dashboard-stats'),
    path('services/', VendorServiceListCreateView.as_view(), name='vendor-services-list'),
    path('services/<int:pk>/', VendorServiceDetailView.as_view(), name='vendor-service-detail'),
    path('services/<int:service_id>/tickets/', ServiceTicketListCreateView.as_view(), name='service-tickets'),
    path('sales/', TicketSaleListView.as_view(), name='vendor-sales'),
    path('analytics/', SalesAnalyticsView.as_view(), name='vendor-analytics'),
    
    path('', include(router.urls)),
]
