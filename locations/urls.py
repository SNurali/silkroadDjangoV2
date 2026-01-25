from django.urls import path
from .views import CountryListAPIView, search_locations, RegionListAPIView, DistrictListAPIView, SightListAPIView

urlpatterns = [
    path('countries/', CountryListAPIView.as_view(), name='country-list'),
    path('regions/', RegionListAPIView.as_view(), name='region-list'),
    path('districts/', DistrictListAPIView.as_view(), name='district-list'),
    path('sights/', SightListAPIView.as_view(), name='sight-list'),
    path('search/', search_locations, name='location-search'),
]
