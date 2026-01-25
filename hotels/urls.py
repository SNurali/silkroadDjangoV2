from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views
from .views_api import BookingViewSet, PersonInfoView
from .api_emehmon import EmehmonCheckAPIView
from .api_payment import PaymentRegisterView, PaymentConfirmView

app_name = 'hotels'

router = DefaultRouter()
router.register(r'bookings', BookingViewSet, basename='booking')

urlpatterns = [
    # API Router
    path('api/', include(router.urls)),
    path('api/person-info/', PersonInfoView.as_view(), name='api_person_info'),

    # Hotels (Legacy Home)
    path('', views.HotelListView.as_view(), name='home'),
    path('hotels/', views.HotelListView.as_view(), name='hotel_list'),
    path('hotels/<int:pk>/', views.HotelDetailView.as_view(), name='hotel_detail'),
    path('hotels/<int:pk>/booking/', views.BookingCreateView.as_view(), name='hotel_booking'),

    # Sights
    path('sights/', views.SightListView.as_view(), name='sight_list'),
    path('sights/partial/', views.SightListView.as_view(), name='sight_partial_list'),
    path('sights/<int:pk>/', views.SightDetailView.as_view(), name='sight_detail'),
    path('sights/create/', views.SightCreateView.as_view(), name='sight_create'),
    path('sights/<int:pk>/buy-ticket/', views.TicketCreateView.as_view(), name='ticket_buy'),

    # API
    path('api/sights/', views.SightListAPIView.as_view(), name='api_sight_list'),
    path('api/sights/<int:pk>/', views.SightDetailAPIView.as_view(), name='api_sight_detail'),
    path('api/hotels/', views.HotelListAPIView.as_view(), name='api_hotel_list'),
    path('api/hotels/<int:pk>/', views.HotelDetailAPIView.as_view(), name='api_hotel_detail'),
    path('api/tickets/', views.TicketListAPIView.as_view(), name='api_ticket_list'),

    # Custom endpoints for Booking functionality
    path('api/hotels/emehmon/check/', EmehmonCheckAPIView.as_view(), name='api_emehmon_check'),
    path('api/hotels/bookings/', BookingViewSet.as_view({'post': 'create'}), name='api_hotel_booking_create'),

    path('hotels/calculate-total/', views.calculate_total, name='calculate_total'),
]