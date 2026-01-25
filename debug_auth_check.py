
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'silkroad_backend.settings')
django.setup()

from django.contrib.auth import authenticate
from accounts.models import User

try:
    user = User.objects.get(email='test@example.com')
    print(f"Resetting password for {user.email}")
    user.set_password('password')
    user.save()
    print(f"User exists: {user} check_password: {user.check_password('password')}")
except User.DoesNotExist:
    print("User does not exist")

u1 = authenticate(email='test@example.com', password='password')
print(f"Auth(email=...): {u1}")

u2 = authenticate(username='test@example.com', password='password')
print(f"Auth(username=...): {u2}")
