import os
import sys
import django

# Setup Django environment
sys.path.append('/home/mrnurali/PycharmProjects/SilkRoad/silkroadDjangoV2')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'silkroad_backend.settings')
django.setup()

from rest_framework.test import APIClient
from accounts.models import User

def debug_500():
    client = APIClient()
    user = User.objects.filter(id=61).first()
    if not user:
        print("User 61 not found")
        return
    
    if user:
        client.force_authenticate(user=user)
    
    print("Requesting /api/accounts/profile/...")
    try:
        response = client.get('/api/accounts/profile/')
        print(f"Status Code: {response.status_code}")
        if response.status_code >= 500:
            print("Response Content (First 2000 chars):")
            print(response.content[:2000].decode('utf-8', errors='ignore'))
        else:
            print(f"Success or non-500 error. Data: {response.data if hasattr(response, 'data') else 'No data'}")
            
        print("\nRequesting /api/hotels/...")
        response = client.get('/api/hotels/')
        print(f"Status Code: {response.status_code}")
        if response.status_code >= 500:
            print("Response Content (First 2000 chars):")
            print(response.content[:2000].decode('utf-8', errors='ignore'))

    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_500()
