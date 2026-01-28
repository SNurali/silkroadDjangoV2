from rest_framework import permissions

class IsVendorOwner(permissions.BasePermission):
    """
    Allows access only to the owner of the vendor.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'vendor'

    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'vendor'):
            return obj.vendor.entry_by == request.user
        return False

class IsVendorOperator(permissions.BasePermission):
    """
    Allows access to vendor operators associated with the vendor.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['vendor', 'vendor_op']

class IsObjectOwner(permissions.BasePermission):
    """
    Allows access only if the object belongs to the requesting user.
    """
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        return False
