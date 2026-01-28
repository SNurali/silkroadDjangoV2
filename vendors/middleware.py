from rest_framework_simplejwt.authentication import JWTAuthentication
from django.utils.deprecation import MiddlewareMixin
from .models import Vendor

class VendorContextMiddleware(MiddlewareMixin):
    """
    Middleware to attach active vendor context to the request object.
    Requires JWT authentication with custom claims.
    """
    def process_request(self, request):
        request.vendor = None
        request.vendor_role = None
        request.active_context = 'user'

        # We can't use request.user directly here if authentication hasn't run yet.
        # But we can try to parse the token manually if it's there.
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return

        try:
            # We use JWTAuthentication's logic to validate and decode
            authenticator = JWTAuthentication()
            validated_token = authenticator.get_validated_token(auth_header.split(' ')[1])
            
            # Extract claims
            request.active_context = validated_token.get('active_context', 'user')
            vendor_id = validated_token.get('vendor_id')
            request.vendor_role = validated_token.get('vendor_role')

            if request.active_context == 'vendor' and vendor_id:
                try:
                    request.vendor = Vendor.objects.get(id=vendor_id)
                except Vendor.DoesNotExist:
                    request.active_context = 'user'
                    request.vendor = None
        except:
            # Token invalid or other error, fallback to default
            pass
