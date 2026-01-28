from django.urls import path, include

from . import views, views_api

app_name = 'hotels'

urlpatterns = [
    # Hotels (Legacy Home)
    path('', views.HotelListView.as_view(), name='home'),
    path('hotels/', views.HotelListView.as_view(), name='hotel_list'),
    path('hotels/<int:pk>/', views.HotelDetailView.as_view(), name='hotel_detail'),

    # Sights
    path('sights/', views.SightListView.as_view(), name='sight_list'),
    path('sights/partial/', views.SightListView.as_view(), name='sight_partial_list'),
    path('sights/<int:pk>/', views.SightDetailView.as_view(), name='sight_detail'),
    path('sights/create/', views.SightCreateView.as_view(), name='sight_create'),

    # API
    path('api/sights/', views.SightListAPIView.as_view(), name='api_sight_list'),
    path('api/sights/<int:pk>/', views.SightDetailAPIView.as_view(), name='api_sight_detail'),
    path('api/hotels/', views.HotelListAPIView.as_view(), name='api_hotel_list'),
    path('api/hotels/<int:pk>/', views.HotelDetailAPIView.as_view(), name='api_hotel_detail'),
    
    path('api/hotels/rooms/search/', views.HotelRoomSearchAPIView.as_view(), name='api_hotel_room_search'),

    path('api/hotels/trending/', views_api.TrendingHotelsAPIView.as_view(), name='api_hotel_trending'),
    path('hotels/calculate-total/', views.calculate_total, name='calculate_total'),
]