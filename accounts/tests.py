from django.test import TestCase, override_settings
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from .models import User, UserImage
from vendors.models import Vendor, VendorImage
from django.core.files.uploadedfile import SimpleUploadedFile
import tempfile
import shutil
import os
from rest_framework_simplejwt.tokens import RefreshToken

# Create temp media root
TEMP_MEDIA_ROOT = tempfile.mkdtemp(prefix='silkroad_test_media')

@override_settings(MEDIA_ROOT=TEMP_MEDIA_ROOT)
class ImageGalleryTests(APITestCase):
    
    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(TEMP_MEDIA_ROOT, ignore_errors=True)
        super().tearDownClass()

    def setUp(self):
        # Create User
        self.user = User.objects.create_user(
            email='testuser@example.com',
            password='password123',
            role='user'
        )
        # Create Vendor User
        self.vendor_user = User.objects.create_user(
            email='vendor@example.com',
            password='password123',
            role='vendor'
        )
        # Create Vendor Profile
        self.vendor_profile = Vendor.objects.create(
            user=self.vendor_user,
            name='Test Vendor'
        )
        
        # Get Tokens
        self.user_token = self.get_token(self.user)
        self.vendor_token = self.get_token(self.vendor_user)

    def get_token(self, user):
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
        
    def test_upload_image_user(self):
        """Test uploading image as User"""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.user_token)
        url = reverse('accounts:upload_image')
        
        image = SimpleUploadedFile("test.jpg", b"file_content", content_type="image/jpeg")
        data = {'image': image}
        
        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(UserImage.objects.filter(user=self.user).exists())
        self.assertTrue(response.data['image'].startswith('/media/user_photos/')) # Or relative if serializers

    def test_upload_image_vendor(self):
        """Test uploading image as Vendor"""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.vendor_token)
        url = reverse('accounts:upload_image')
        
        image = SimpleUploadedFile("vendor_test.jpg", b"vendor_content", content_type="image/jpeg")
        data = {'image': image}
        
        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(VendorImage.objects.filter(vendor=self.vendor_profile).exists())
        self.assertTrue(response.data['image'].startswith('/media/vendor_photos/'))

    def test_gallery_list_user(self):
        """Test listing user's gallery"""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.user_token)
        
        # Create some images
        for i in range(3):
            UserImage.objects.create(user=self.user, image=f'test{i}.jpg', order=i)
            
        url = reverse('accounts:user-gallery-list') # basename 'user-gallery' -> 'user-gallery-list'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Handle pagination
        data = response.data.get('results', response.data)
        self.assertEqual(len(data), 3)
        # Order is ascending by default 'order'
        self.assertEqual(data[0]['order'], 0)
        # Ascending order? 'order'. So 0 comes first?
        # Wait, if ordering = ['order', ...], then 0 is first.
        # Let's check logic: order is positive integer. 0, 1, 2.
        # response should comply.
        
    def test_delete_image_user(self):
        """Test deleting own image"""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.user_token)
        img = UserImage.objects.create(user=self.user, image='del.jpg')
        
        url = reverse('accounts:user-gallery-detail', args=[img.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(UserImage.objects.filter(id=img.id).exists())

    def test_delete_other_user_image(self):
        """Test verify cannot delete other user's image"""
        # Auth as vendor (or another user)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.vendor_token)
        img = UserImage.objects.create(user=self.user, image='mine.jpg')
        
        url = reverse('accounts:user-gallery-detail', args=[img.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND) # ModelViewSet filters queryset by request.user!
        # So it returns 404 because user can't see it in queryset. This is correct behavior for 'IsOwner' + ViewSet filter.
        
    def test_unauthorized_access(self):
        """Test 401 if no token"""
        url = reverse('accounts:upload_image')
        response = self.client.post(url, {})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_reorder_action(self):
        """Test custom reorder action"""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.user_token)
        img = UserImage.objects.create(user=self.user, image='reorder.jpg', order=5)
        
        url = reverse('accounts:user-gallery-reorder', args=[img.id])
        response = self.client.patch(url, {'order': 10}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        img.refresh_from_db()
        self.assertEqual(img.order, 10)
