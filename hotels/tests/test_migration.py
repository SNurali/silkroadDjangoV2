from django.test import TestCase, Client
from django.urls import reverse
from hotels.models import Hotel, RoomType, Room, Sight, Category
from locations.models import Region, Country, District
from accounts.models import User
from vendors.models import Vendor

class MigrationVerificationTest(TestCase):
    def setUp(self):
        # Setup basic data
        self.country = Country.objects.create(name="Uzbekistan", iso_code="UZ")
        self.region = Region.objects.create(name="Tashkent", country=self.country)
        self.district = District.objects.create(name="Chilanzar", region=self.region)
        
        self.user = User.objects.create_user(email='test@example.com', password='password', role='vendor')
        
        self.category = Category.objects.create(name="Historical", entry_by=self.user)
        
        self.vendor = Vendor.objects.create(
            user=self.user,
            country=self.country,
            region=self.region,
            district=self.district,
            name="Test Vendor",
            category=self.category,
            entry_by=self.user
        )
        
        self.hotel = Hotel.objects.create(
            name="Test Hotel",
            region=self.region,
            stars=4,
            created_by=self.user
        )
        self.room_type = RoomType.objects.create(en="Standard")
        self.room = Room.objects.create(hotel=self.hotel, room_type=self.room_type)
        
        self.sight = Sight.objects.create(
            name="Test Sight",
            vendor=self.vendor,
            category=self.category,
            status='active'
        )
        
    def test_urls_exist(self):
        """Test that main migration URLs are resolvable"""
        urls = [
            'hotels:home',
            'hotels:hotel_list',
            'hotels:sight_list',
        ]
        for url_name in urls:
            url = reverse(url_name)
            self.assertIsNotNone(url)
            print(f"URL Verified: {url_name} -> {url}")

    def test_hotel_list_view(self):
        """Test Hotel List response"""
        response = self.client.get(reverse('hotels:hotel_list'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Test Hotel")
        self.assertTemplateUsed(response, 'hotels/hotel_list.html')

    def test_hotel_detail_view(self):
        """Test Hotel Detail response"""
        response = self.client.get(reverse('hotels:hotel_detail', args=[self.hotel.pk]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Test Hotel")
        self.assertTemplateUsed(response, 'hotels/hotel_detail.html')

    def test_booking_view_redirect(self):
        """Test Booking View (Login Required)"""
        response = self.client.get(reverse('hotels:hotel_booking', args=[self.hotel.pk]))
        self.assertEqual(response.status_code, 302) # Redirects to login
