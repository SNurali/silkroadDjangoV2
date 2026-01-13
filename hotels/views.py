from rest_framework.views import APIView
from rest_framework.response import Response
from accounts.permissions import IsAdminOrVendor


class HotelCreateView(APIView):
    permission_classes = [IsAdminOrVendor]

    def post(self, request):
        return Response({
            "status": "Отель создан"
        })
