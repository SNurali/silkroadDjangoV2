from rest_framework.permissions import BasePermission


class IsVendorOwner(BasePermission):
    """
    Permission: Only the vendor owner (user linked to vendor profile).
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            hasattr(request.user, 'vendor_profile') and
            request.user.vendor_profile.operator_role == 'vendor'
        )
    
    def has_object_permission(self, request, view, obj):
        # For Vendor objects
        if hasattr(obj, 'user'):
            return obj.user == request.user and obj.operator_role == 'vendor'
        # For related objects (VendorService, etc.)
        if hasattr(obj, 'vendor'):
            return obj.vendor.user == request.user and obj.vendor.operator_role == 'vendor'
        return False


class IsVendorOperator(BasePermission):
    """
    Permission: Vendor owner OR operator (both can manage services/tickets).
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            hasattr(request.user, 'vendor_profile')
        )
    
    def has_object_permission(self, request, view, obj):
        # For Vendor objects
        if hasattr(obj, 'user'):
            return obj.user == request.user
        # For related objects (VendorService, ServiceTicket, etc.)
        if hasattr(obj, 'vendor'):
            return obj.vendor.user == request.user
        # For TicketSale (check via ticket_type -> service -> vendor)
        if hasattr(obj, 'ticket_type'):
            return obj.ticket_type.service.vendor.user == request.user
        return False


class CanManageServices(BasePermission):
    """
    Permission: Can create/edit/delete services (both VENDOR and VENDOR_OPERATOR).
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            hasattr(request.user, 'vendor_profile')
        )


class CanSellTickets(BasePermission):
    """
    Permission: Can sell tickets (both VENDOR and VENDOR_OPERATOR).
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            hasattr(request.user, 'vendor_profile')
        )


class CanManageVendorSettings(BasePermission):
    """
    Permission: Only VENDOR (owner) can change company settings.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            hasattr(request.user, 'vendor_profile') and
            request.user.vendor_profile.operator_role == 'vendor'
        )
