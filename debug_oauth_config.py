import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'silkroad_backend.settings')
django.setup()

from django.conf import settings

def debug_oauth():
    print("DEBUG OAUTH CONFIG:")
    google_id = os.getenv('GOOGLE_CLIENT_ID')
    google_secret = os.getenv('GOOGLE_CLIENT_SECRET')
    print(f"ENV GOOGLE_CLIENT_ID: {google_id}")
    print(f"ENV GOOGLE_CLIENT_SECRET: {google_secret}")
    
    providers = getattr(settings, 'SOCIALACCOUNT_PROVIDERS', {})
    google_app = providers.get('google', {}).get('APP', {})
    
    s_id = google_app.get('client_id')
    s_secret = google_app.get('secret')
    
    print(f"SETTINGS GOOGLE_CLIENT_ID: {s_id}")
    print(f"SETTINGS GOOGLE_CLIENT_SECRET: {s_secret}")
    
    is_configured = bool(s_id and s_secret)
    print(f"IS CONFIGURED: {is_configured}")

if __name__ == "__main__":
    debug_oauth()
