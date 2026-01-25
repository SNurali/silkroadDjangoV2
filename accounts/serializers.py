from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, UserImage


class UserImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserImage
        fields = '__all__'
        read_only_fields = ('user', 'uploaded_at')


class UserSerializer(serializers.ModelSerializer):
    images = UserImageSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "name",
            "lname",
            "first_name",
            "last_name",
            "phone",
            "id_citizen",
            "dtb",
            "sex",
            "passport",
            "pspissuedt",
            "role",
            "images",
        )
        read_only_fields = ('id', 'email', 'role', 'images')



class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = (
            "email",
            "password",
            "name",
            "lname",
            "phone",
        )

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Bu email manzili allaqachon ro‘yxatdan o‘tgan.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            name=validated_data.get('name', ''),
            lname=validated_data.get('lname', ''),
            phone=validated_data.get('phone', '')
        )
        return user

        return user

class UserProfileSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    # Explicitly define photo to accept Image/File, not just Char
    photo = serializers.ImageField(required=False, allow_null=True, write_only=True)
    
    class Meta:
        model = User
        fields = (
            'id', 'name', 'email', 'phone', 'passport', 
            'sex', 'id_citizen', 'dtb', 'pspissuedt', 
            'avatar_url', 'photo'
        )
        read_only_fields = ('id', 'email', 'avatar_url')

    def get_avatar_url(self, obj):
        if obj.photo:
             if obj.photo.startswith('http'):
                 return obj.photo
             request = self.context.get('request')
             if request:
                 return request.build_absolute_uri(f'/media/avatars/{obj.photo}')
             return f'/media/avatars/{obj.photo}'
        return None

    def update(self, instance, validated_data):
        photo_file = validated_data.pop('photo', None)
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        if photo_file:
            # Generate unique filename similar to legacy or simple timestamp
            import os
            import uuid
            from django.core.files.storage import default_storage
            from django.core.files.base import ContentFile
            
            ext = os.path.splitext(photo_file.name)[1]
            filename = f"{instance.id}-{uuid.uuid4().hex[:6]}{ext}"
            path = f"avatars/{filename}"
            
            # Delete old photo if exists/needed (Optional)
            
            # Save new file
            default_storage.save(path, ContentFile(photo_file.read()))
            
            instance.photo = filename
            
        instance.save()
        return instance

class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(
            username=data["email"],
            password=data["password"]
        )
        if not user:
            raise serializers.ValidationError("Неверный email или пароль")
        data["user"] = user
        return data


class TravelerSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        model = None # Override below
    
    def get_fields(self):
        # Local import to avoid circular dependency if models loaded early
        from .models import Traveler
        self.Meta.model = Traveler
        return super().get_fields()

    class Meta:
        from .models import Traveler
        model = Traveler
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')
