from django.contrib import admin
from .models import Vendor, VendorUserRole


@admin.register(VendorUserRole)
class VendorUserRoleAdmin(admin.ModelAdmin):
    list_display = ('user', 'vendor', 'role', 'created_at')
    list_filter = ('role', 'vendor')
    search_fields = ('user__email', 'vendor__brand_name')


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = (
        'brand_name',
        'legal_name',
        'status',
        'is_active',
        'address',
        'created_at',
    )
    list_filter = ('status', 'is_active', 'country', 'region')
    search_fields = ('brand_name', 'legal_name', 'tax_id', 'address')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'

    fieldsets = (
        (None, {
            'fields': ('status', 'brand_name', 'legal_name', 'tax_id', 'is_active', 'category')
        }),
        ('Контактная информация', {
            'fields': ('contact_email', 'phone', 'address', 'geo')
        }),
        ('Локация', {
            'fields': ('country', 'region', 'district')
        }),
        ('Дополнительно', {
            'fields': ('photo', 'entry_by', 'attributes', 'bill_data', 'business_type', 'checking_account', 'mfo', 'contacts')
        }),
        ('Временные метки', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )