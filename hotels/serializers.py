from rest_framework import serializers

from accounts.models import User
from .models import Sight, Category, SightFacility, Ticket


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'photo')


class SightFacilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = SightFacility
        fields = ('id', 'name', 'icon')


class UserSerializer(serializers.ModelSerializer):
    """
    Минимальный сериализатор пользователя (для отображения в билетах, заказах и т.д.).
    """
    class Meta:
        model = User
        fields = ('id', 'email', 'name')  # можно добавить 'phone', 'role' и т.д. при необходимости
        read_only_fields = fields


class SightSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    facilities = SightFacilitySerializer(many=True, read_only=True)

    class Meta:
        model = Sight
        fields = (
            'id',
            'name',
            'sh_description',
            'description',
            'address',
            'geolocation',
            'images',
            'status',
            'is_foreg',           # цена для иностранцев
            'is_local',           # цена для местных
            'max_capacity',
            'opening_times',
            'extra_services',
            'required_conditions',
            'enable_tickets',
            'category',
            'facilities',
            'created_at',
        )
        read_only_fields = (
            'id',
            'status',
            'created_at',
            # 'vendor' если есть такое поле — тоже можно добавить
        )


class TicketSerializer(serializers.ModelSerializer):
    sight = SightSerializer(read_only=True)
    user = UserSerializer(read_only=True, source='created_by')  # ← это работает

    class Meta:
        model = Ticket
        fields = (
            'id',
            'sight',
            'total_qty',
            'total_amount',
            'is_paid',
            'is_valid',
            'created_at',
            'user',                 # ← добавлено
        )
        read_only_fields = (
            'id',
            'total_amount',
            'is_paid',
            'is_valid',
            'created_at',
            'user',
        )