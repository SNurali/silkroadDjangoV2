
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import views_api, views_payment

router = DefaultRouter()
router.register(r'bookings', views.BookingViewSet, basename='booking')

urlpatterns = [
    # Hotels (Root of api/hotels/)
    path('', views.HotelListAPIView.as_view(), name='api_hotel_list'),
    path('<int:pk>/', views.HotelDetailAPIView.as_view(), name='api_hotel_detail'),

    # Sights
    path('sights/', views.SightListAPIView.as_view(), name='api_sight_list'),
    path('sights/<int:pk>/', views.SightDetailAPIView.as_view(), name='api_sight_detail'),
    
    # Tickets
    path('tickets/', views.TicketListAPIView.as_view(), name='api_ticket_list'),
    path('tickets/buy/', views.TicketCreateAPIView.as_view(), name='api_ticket_buy'),
    path('tickets/pay/', views.PayTicketAPIView.as_view(), name='api_ticket_pay_legacy'),

    # Legacy mappings (preserved)
    path('categories/', views_api.CategoryListAPIView.as_view(), name='api_category_list'),
    path('buy-ticket/', views_api.TicketPurchaseView.as_view(), name='api_ticket_purchase'),

    # Payment System (Emehmon + Yagona) - New
    path('emehmon/check/', views_payment.PersonInfoAPIView.as_view(), name='api_emehmon_check'),
    path('payment/register/', views_payment.CardRegisterAPIView.as_view(), name='api_payment_register'),
    path('payment/confirm/', views_payment.PaymentConfirmAPIView.as_view(), name='api_payment_confirm'),
    
    # ViewSets
    path('', include(router.urls)),
]
