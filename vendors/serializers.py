from rest_framework import serializers
from .models import Vendor


class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = (
            "id",
            "name",
            "description",
            "phone",
            "is_active",
            "created_at",
        )
        read_only_fields = ("id", "created_at")


class VendorCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = (
            "name",
            "description",
            "phone",
        )
