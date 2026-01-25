from rest_framework import viewsets, permissions, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, UserImage
from .serializers import (
    UserSerializer, LoginSerializer, UserImageSerializer, 
    RegisterSerializer, UserProfileSerializer, ChangePasswordSerializer
)
from .permissions import IsOwner, IsVendor

# -------------------------------------------------------------------------
# Auth Views (Restored)
# -------------------------------------------------------------------------

class LoginView(APIView):
    authentication_classes = []
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })

class LogoutView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_255_RESET_CONTENT)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    authentication_classes = []
    permission_classes = (permissions.AllowAny,)

class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserProfileSerializer

    def get_object(self):
        return self.request.user

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        
        # Calculate completion %
        fields = ['name', 'email', 'phone', 'passport', 'sex', 'id_citizen', 'dtb', 'pspissuedt']
        filled = sum(1 for f in fields if getattr(instance, f))
        total = len(fields)
        data['completion_percent'] = round((filled / total) * 100)
        
        return Response(data)

class ChangePasswordView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data['current_password']):
                return Response({'current_password': ['Wrong password.']}, status=status.HTTP_400_BAD_REQUEST)
            
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'status': 'Password updated successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# -------------------------------------------------------------------------
# Image / Gallery Views (New)
# -------------------------------------------------------------------------

class UploadImageView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        file = request.FILES.get('image')
        if not file:
            return Response({'error': 'No image provided'}, status=400)

        is_vendor = (request.user.role == 'vendor')
        
        if is_vendor:
            try:
                from vendors.models import VendorImage
                from vendors.serializers import VendorImageSerializer
                
                vendor_profile = getattr(request.user, 'vendor_profile', None)
                if not vendor_profile:
                     return Response({'error': 'Vendor profile not found'}, status=400)
                     
                obj = VendorImage(vendor=vendor_profile, image=file)
                obj.order = obj._get_next_order()
                obj.save()
                return Response(VendorImageSerializer(obj).data, status=201)
            except (ImportError, AttributeError):
                 return Response({'error': 'Vendor app not available'}, status=500)
        else:
            obj = UserImage(user=request.user, image=file)
            obj.order = obj._get_next_order()
            obj.save()
            return Response(UserImageSerializer(obj).data, status=201)


class UserGalleryViewSet(viewsets.ModelViewSet):
    serializer_class = UserImageSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    
    def get_queryset(self):
        return UserImage.objects.filter(user=self.request.user).order_by('order', '-uploaded_at')

    @action(detail=True, methods=['patch'], url_path='reorder')
    def reorder(self, request, pk=None):
        obj = self.get_object()
        new_order = request.data.get('order')
        if new_order is not None:
            obj.order = new_order
            obj.save()
            return Response({'status': 'reordered'})
        return Response({'error': 'order field required'}, status=400)


# -------------------------------------------------------------------------
# Template Views (Frontend)
# -------------------------------------------------------------------------
from django.shortcuts import render
from django.contrib.auth.decorators import login_required

@login_required
def profile_view(request):
    user = request.user
    images = UserImage.objects.filter(user=user).order_by('order')
    return render(request, 'users/profile.html', {
        'user': user,
        'images': images
    })


from .models import Traveler
from .serializers import TravelerSerializer

class TravelerViewSet(viewsets.ModelViewSet):
    """
    CRUD для попутчиков.
    """
    serializer_class = TravelerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Traveler.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)