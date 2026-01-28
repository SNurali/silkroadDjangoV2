from rest_framework_simplejwt.tokens import RefreshToken
from .models import VendorUserRole

def get_tokens_for_user(user, context='user', vendor_id=None):
    """
    Generates a new set of tokens with the specified context.
    """
    refresh = RefreshToken.for_user(user)
    
    # Add custom claims
    refresh['active_context'] = context
    
    if context == 'vendor' and vendor_id:
        try:
            role_obj = VendorUserRole.objects.get(user=user, vendor_id=vendor_id)
            refresh['vendor_id'] = vendor_id
            refresh['vendor_role'] = role_obj.role
            refresh['vendor_name'] = role_obj.vendor.brand_name
        except VendorUserRole.DoesNotExist:
            # Fallback if role is missing but context forced
            refresh['active_context'] = 'user'
    else:
        refresh['vendor_id'] = None
        refresh['vendor_role'] = None
    
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }
