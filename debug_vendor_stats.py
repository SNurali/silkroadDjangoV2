import os
import django
import sys

# Setup Django environment
# Add current directory to path so 'silkroad_backend' module can be found
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'silkroad_backend.settings')
django.setup()

from accounts.models import User
from vendors.models import Vendor
from hotels.models import Hotel, Sight, Ticket

# email = "agent_test@example.com"
userId = 20

try:
    user = User.objects.get(id=userId)
    print(f"User found: {user.email} (ID: {user.id})")
except User.DoesNotExist:
    print(f"User ID {userId} not found!")
    exit(1)

try:
    vendor = user.vendor_profile
    print(f"Vendor profile found: {vendor.name} (ID: {vendor.id})")
except Exception as e:
    print(f"Vendor profile error: {e}")
    vendor = None

if vendor:
    print(f"\n--- Stats for Vendor {vendor.id} ---")
    
    # 1. Hotels
    hotels_by_vendor = Hotel.objects.filter(vendor=vendor).count()
    hotels_by_user = Hotel.objects.filter(created_by=user).count()
    print(f"Hotels (by vendor): {hotels_by_vendor}")
    print(f"Hotels (by user): {hotels_by_user}")
    
    # 2. Tours
    tours_by_vendor = Sight.objects.filter(vendor=vendor).count()
    tours_by_user = Sight.objects.filter(created_by=user).count()
    print(f"Tours (by vendor): {tours_by_vendor}")
    print(f"Tours (by user): {tours_by_user}")
    
    # 3. Tickets
    tickets_by_vendor = Ticket.objects.filter(vendor=vendor).count()
    tickets_by_user = Ticket.objects.filter(created_by=user).count()
    print(f"Tickets (by vendor): {tickets_by_vendor}")
    print(f"Tickets (by user): {tickets_by_user}")

    # Inspect a tour if mismatch
    if tours_by_vendor == 0 and tours_by_user > 0:
        print("\n[!] Mismatch detected in Tours. Checking first tour by user:")
        tour = Sight.objects.filter(created_by=user).first()
        print(f"Tour ID: {tour.id}, Name: {tour.name}")
        print(f"Tour Vendor Field: {tour.vendor} (ID: {tour.vendor_id if tour.vendor else 'None'})")
        
        # Auto-fix proposal
        # if not tour.vendor:
        #    print("Proposal: Backfill vendor from user")

else:
    print("No vendor profile linked to user.")
