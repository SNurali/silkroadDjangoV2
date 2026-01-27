from django.contrib import admin

from .models import Category, Sight, SightFacility, Ticket, Hotel, Booking, HotelComment  # SightImage убрали

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


@admin.register(Hotel)
class HotelAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'region', 'stars', 'rating', 'is_active', 'created_at')
    list_filter = ('is_active', 'stars', 'region', 'created_at')
    search_fields = ('name', 'address', 'description')
    date_hierarchy = 'created_at'


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'hotel', 'guest_name', 'check_in', 'check_out', 'booking_status', 'payment_status', 'created_at')
    list_filter = ('booking_status', 'payment_status', 'created_at')
    search_fields = ('guest_name', 'guest_email', 'hotel__name')
    date_hierarchy = 'created_at'


@admin.register(HotelComment)
class HotelCommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'hotel', 'user', 'rating', 'status', 'created_at')
    list_filter = ('status', 'rating', 'created_at')
    search_fields = ('hotel__name', 'user__name', 'user__email', 'comment')
    list_editable = ('status',)
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('hotel', 'user', 'rating', 'status')
        }),
        ('Content', {
            'fields': ('comment',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )