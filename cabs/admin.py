from django.contrib import admin
from .models import Cab

@admin.register(Cab)
class CabAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'capacity', 'rating', 'order')
    list_editable = ('price', 'order')
    search_fields = ('name',)
