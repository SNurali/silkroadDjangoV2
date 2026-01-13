from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import LoginSerializer, UserSerializer
from .permissions import IsAdmin, IsVendor, IsAgent


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        refresh = RefreshToken.for_user(user)

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data,
        })


class AdminOnlyView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response({
            "message": "Доступ разрешён: ADMIN"
        })


class VendorOnlyView(APIView):
    permission_classes = [IsVendor]

    def get(self, request):
        return Response({
            "message": "Доступ разрешён: VENDOR"
        })


class AgentOnlyView(APIView):
    permission_classes = [IsAgent]

    def get(self, request):
        return Response({
            "message": "Доступ разрешён: AGENT"
        })
