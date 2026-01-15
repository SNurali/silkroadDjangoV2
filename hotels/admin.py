from django.contrib import admin

from .models import Category, Sight, SightFacility, Ticket  # SightImage убрали

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name',)

@admin.register(Sight)
class SightAdmin(admin.ModelAdmin):
    list_display = ('name', 'vendor', 'category', 'status', 'is_foreg', 'is_local', 'enable_tickets')
    list_filter = ('status', 'category', 'vendor')
    search_fields = ('name', 'description', 'sh_description')
    raw_id_fields = ('vendor', 'category', 'created_by')

@admin.register(SightFacility)
class SightFacilityAdmin(admin.ModelAdmin):
    list_display = ('name', 'sight')
    search_fields = ('name',)

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('id', 'sight', 'vendor', 'total_qty', 'total_amount', 'is_paid', 'is_valid')
    list_filter = ('is_paid', 'is_valid')
    search_fields = ('sight__name', 'vendor__name')