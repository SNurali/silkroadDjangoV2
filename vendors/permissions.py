from rest_framework import permissions

class IsVendorContext(permissions.BasePermission):
    """
    Allows access only to users currently in 'vendor' context.
    The middleware must have already attached 'vendor' and 'vendor_role' to the request.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if middleware attached the vendor
        if not hasattr(request, 'active_context') or request.active_context != 'vendor':
            return False
            
        if not request.vendor:
            return False
            
        return True

class IsVendorOwner(IsVendorContext):
    """
    Allows access only if the user is an OWNER in the active vendor context.
    """
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
            
        return request.vendor_role == 'OWNER'

class IsVendorOperator(IsVendorContext):
    """
    Allows access if the user is an OWNER or OPERATOR.
    """
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
            
        return request.vendor_role in ['OWNER', 'OPERATOR']

class CanManageServices(IsVendorContext):
    """OWNER and OPERATOR can manage services."""
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.vendor_role in ['OWNER', 'OPERATOR']

class CanSellTickets(IsVendorContext):
    """OWNER and OPERATOR can sell/manage tickets."""
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.vendor_role in ['OWNER', 'OPERATOR']

class CanManageVendorSettings(IsVendorContext):
    """Only OWNER can manage vendor settings."""
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.vendor_role == 'OWNER'
