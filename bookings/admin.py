from django.contrib import admin
from .models import Booking, BookingStatusHistory

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'hotel', 'check_in', 'check_out', 'status', 'total_price', 'created_at')
    list_filter = ('status', 'created_at', 'hotel')
    search_fields = ('user__email', 'hotel__name', 'emehmon_id')
    date_hierarchy = 'created_at'
    raw_id_fields = ('user', 'hotel', 'room_type', 'currency')

@admin.register(BookingStatusHistory)
class BookingStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ('booking', 'status', 'timestamp', 'changed_by')
    list_filter = ('status', 'timestamp')
    raw_id_fields = ('booking', 'changed_by')
