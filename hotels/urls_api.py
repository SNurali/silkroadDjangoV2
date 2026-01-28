from django.urls import path, include
from . import views
from . import views_api, views_payment, views_pdf

urlpatterns = [
    # Hotels (Root of api/hotels/)
    path('', views.HotelListAPIView.as_view(), name='api_hotel_list'),
    path('<int:pk>/', views.HotelDetailAPIView.as_view(), name='api_hotel_detail'),
    path('<int:hotel_id>/search-rooms/', views.HotelRoomSearchAPIView.as_view(), name='api_hotel_search_rooms'),
    
    # Hotel Comments & Reviews
    path('<int:hotel_id>/comments/', views_api.HotelCommentListCreateView.as_view(), name='api_hotel_comments'),
    path('<int:hotel_id>/comments/stats/', views_api.HotelCommentStatsView.as_view(), name='api_hotel_comments_stats'),
    
    # Sight Comments
    path('sights/<int:sight_id>/comments/', views_api.HotelCommentListCreateView.as_view(), name='api_sight_comments'),
    path('sights/<int:sight_id>/comments/stats/', views_api.HotelCommentStatsView.as_view(), name='api_sight_comments_stats'),
    
    # CAPTCHA
    path('captcha/generate/', views_api.GenerateCaptchaView.as_view(), name='api_captcha_generate'),

    # Sights
    path('sights/', views.SightListAPIView.as_view(), name='api_sight_list'),
    path('sights/<int:pk>/', views.SightDetailAPIView.as_view(), name='api_sight_detail'),
    
    # PDF Downloads
    path('tickets/<int:pk>/download/', views_pdf.TicketPDFDownloadView.as_view(), name='api_ticket_download'),
    path('bookings/<int:pk>/download/', views_pdf.BookingPDFDownloadView.as_view(), name='api_booking_download'),
    path('bookings/<int:pk>/preview/', views_pdf.BookingPDFPreviewView.as_view(), name='api_booking_preview'),

    # Legacy mappings (preserved if views exist)
    path('categories/', views_api.CategoryListAPIView.as_view(), name='api_category_list'),

    # Payment System (Emehmon + Yagona)
    path('emehmon/check/', views_payment.PersonInfoAPIView.as_view(), name='api_emehmon_check'),
    path('payment/register/', views_payment.CardRegisterAPIView.as_view(), name='api_payment_register'),
    path('payment/confirm/', views_payment.PaymentConfirmAPIView.as_view(), name='api_payment_confirm'),
]
