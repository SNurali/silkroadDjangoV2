from django.urls import path
from .views import VendorCreateView, VendorDetailView
from django.urls import path, include

urlpatterns = [
    path("create/", VendorCreateView.as_view(), name="vendor-create"),
    path("me/", VendorDetailView.as_view(), name="vendor-detail"),
    # project urls.py
    path("api/vendors/", include("vendors.urls")),

]
