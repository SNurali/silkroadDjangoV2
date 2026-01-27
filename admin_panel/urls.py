from django.urls import path
from . import views

urlpatterns = [
    # Admin Dashboard
    path('', views.admin_dashboard, name='admin_dashboard'),
    path('dashboard/', views.admin_dashboard, name='admin_dashboard'),
    
    # Admin Vendors
    path('vendors/', views.admin_vendors_list, name='admin_vendors_list'),
    path('vendors/create/', views.admin_vendor_create, name='admin_vendor_create'),
    path('vendors/<int:vendor_id>/', views.admin_vendor_detail, name='admin_vendor_detail'),
    path('vendors/<int:vendor_id>/edit/', views.admin_vendor_edit, name='admin_vendor_edit'),
    path('vendors/<int:vendor_id>/delete/', views.admin_vendor_delete, name='admin_vendor_delete'),
]