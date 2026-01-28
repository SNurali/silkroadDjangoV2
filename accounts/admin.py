from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User, SecurityLog


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = (
        'email',
        'get_full_name',
        'role',
        'phone',
        'is_active',
        'is_staff',
        'date_joined',
    )
    list_filter = ('role', 'is_active', 'is_staff', 'is_superuser')
    search_fields = ('email', 'name', 'lname', 'phone', 'passport')
    ordering = ('-date_joined',)
    readonly_fields = ('last_login', 'date_joined', 'created_by')

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal info'), {
            'fields': (
                'name', 'lname', 'phone', 'photo', 'sex', 'passport',
                'dtb', 'pspissuedt', 'id_citizen', 'social_id', 'social_type',
                'role', 'created_by'
            )
        }),
        (_('Permissions'), {
            'fields': (
                'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'
            ),
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email', 'password1', 'password2', 'name', 'lname', 'phone',
                'role', 'is_active', 'is_staff'
            ),
        }),
    )