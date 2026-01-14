from django.contrib import admin

from .models import Vendor


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'is_active',
        'address',
        'created_at',
        'entry_by',
    )
    list_filter = ('is_active', 'country', 'region')
    search_fields = ('name', 'address', 'geo')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'

    fieldsets = (
        (None, {
            'fields': ('name', 'user', 'is_active', 'category')
        }),
        ('Локация', {
            'fields': ('country', 'region', 'district', 'address', 'geo')
        }),
        ('Дополнительно', {
            'fields': ('photo', 'entry_by', 'attributes', 'bill_data')
        }),
        ('Временные метки', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )