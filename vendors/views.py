from rest_framework import generics, permissions
from .models import Vendor
from .serializers import VendorSerializer, VendorCreateSerializer
from .permissions import IsVendorOwner


class VendorCreateView(generics.CreateAPIView):
    serializer_class = VendorCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class VendorDetailView(generics.RetrieveUpdateAPIView):
    queryset = Vendor.objects.select_related("owner")
    serializer_class = VendorSerializer
    permission_classes = [permissions.IsAuthenticated, IsVendorOwner]
