import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'silkroad_backend.settings')
django.setup()

from accounts.serializers import RegisterSerializer
from accounts.models import User

def test_registration():
    data = {
        "email": "test_register@example.com",
        "password": "Password123!",
        "name": "Test",
        "lname": "User",
        "phone": "+998901234567"
    }
    
    # Clean up existing test user
    User.objects.filter(email=data["email"]).delete()
    
    serializer = RegisterSerializer(data=data)
    if serializer.is_valid():
        try:
            user = serializer.save()
            print(f"SUCCESS: User created with ID {user.id}")
        except Exception as e:
            print(f"FAIL (save): {str(e)}")
            import traceback
            traceback.print_exc()
    else:
        print(f"FAIL (validation): {serializer.errors}")

if __name__ == "__main__":
    test_registration()
