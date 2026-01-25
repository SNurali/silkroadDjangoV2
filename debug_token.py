import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'silkroad_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework.test import APIClient

User = get_user_model()
try:
    user = User.objects.get(email='vendor@silkroad.com')
except User.DoesNotExist:
    user = User.objects.create_user('vendor@silkroad.com', 'password')

print(f"User: {user.email}, ID: {user.id}, Active: {user.is_active}")

# Generate Token
refresh = RefreshToken.for_user(user)
access = str(refresh.access_token)

print(f"Access Token: {access[:20]}...")

# Verify Token Manually
try:
    token = AccessToken(access)
    print("Token verified successfully by AccessToken class.")
except Exception as e:
    print(f"Token verification failed: {e}")

# Test Request
client = APIClient()
client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')

# Try protected view (TicketList)
response = client.get('/api/tickets/')
print(f"Protected Request Status: {response.status_code}")
if response.status_code != 200:
    print(f"Response: {response.data}")

# Try AllowAny view (HotelList)
response = client.get('/api/hotels/')
print(f"AllowAny Request Status: {response.status_code}")
if response.status_code != 200:
    print(f"Response: {response.data}")
