from rest_framework.permissions import BasePermission
from .models import UserImage


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "admin"
        )


class IsAgent(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "agent"
        )


class IsVendor(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "vendor"
        )


class IsUser(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "user"
        )


class IsAdminOrAgent(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ("admin", "agent")
        )


class IsAdminOrVendor(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ("admin", "vendor")
        )

class IsOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        # Local import or use isinstance check
        # Checking class name string to avoid circular imports?
        # Or just import models if safe.
        # UserImage matches obj.__class__.__name__ or isinstance
        
        # UserImage logic
        if hasattr(obj, 'user') and obj.user == request.user:
            return True
            
        # VendorImage logic (check imports dynamically or assumption)
        # Note: vendors.models imports User, so accounts.permissions might cause circular import if it imports vendor models.
        # We can use simple attribute check.
        if hasattr(obj, 'vendor') and hasattr(request.user, 'vendor_profile'):
             return obj.vendor == request.user.vendor_profile
        
        return False
