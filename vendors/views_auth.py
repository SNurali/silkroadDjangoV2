from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Vendor, VendorUserRole
from .utils import get_tokens_for_user

class SwitchToVendorContextView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, vendor_id):
        try:
            # Check if user has a role in this vendor and vendor is active
            role_obj = VendorUserRole.objects.get(
                user=request.user, 
                vendor_id=vendor_id,
                vendor__status='ACTIVE'
            )
        except VendorUserRole.DoesNotExist:
            return Response(
                {'error': 'You do not have access to this vendor or the vendor is not active.'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        tokens = get_tokens_for_user(request.user, context='vendor', vendor_id=vendor_id)
        return Response(tokens)

class SwitchToUserContextView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        tokens = get_tokens_for_user(request.user, context='user')
        return Response(tokens)

class VendorListView(APIView):
    """Returns list of vendors the user has roles in."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        roles = VendorUserRole.objects.filter(user=request.user).select_related('vendor')
        data = [
            {
                'id': r.vendor.id,
                'brand_name': r.vendor.brand_name,
                'role': r.role,
                'status': r.vendor.status
            } for r in roles
        ]
        return Response(data)
