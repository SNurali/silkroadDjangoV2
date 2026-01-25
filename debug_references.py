import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'silkroad_backend.settings')
django.setup()

from rest_framework.test import APIRequestFactory
from vendors.views_api import ReferenceView
from locations.serializers import RegionSerializer
from locations.models import Region, District

# Check count
print(f"Regions count: {Region.objects.count()}")
print(f"Districts count: {District.objects.count()}")

# Check serializer output for first region
region = Region.objects.first()
if region:
    print(f"First Region: {region.name}")
    print(f"Districts in DB for this region: {region.districts.count()}")
    serializer = RegionSerializer(region)
    print("Serializer data keys:", serializer.data.keys())
    districts_data = serializer.data.get('districts', 'MISSING')
    print(f"Districts in Serializer: {len(districts_data) if isinstance(districts_data, list) else districts_data}")
else:
    print("No regions found.")
