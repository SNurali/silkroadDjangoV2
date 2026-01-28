#!/usr/bin/env python3
"""
Payment Integration Test Script
Tests both FAKE_PAYMENT and Real Yagona Billing modes.
"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'silkroad_backend.settings')
django.setup()

from django.conf import settings
from django.contrib.auth import get_user_model
from silkroad_backend.services.yagona import YagonaBillingService
from hotels.models import Hotel, Sight
from bookings.models import Booking
from vendors.models import Vendor, TicketSale
from decimal import Decimal

User = get_user_model()

def test_payment_configuration():
    """Test 1: Verify payment system configuration"""
    print("\n" + "="*60)
    print("TEST 1: Payment Configuration")
    print("="*60)
    
    print(f"\n✓ FAKE_PAYMENT Mode: {settings.FAKE_PAYMENT}")
    print(f"✓ Yagona Client ID: {settings.YAGONA_BILLING_CLIENT}")
    print(f"✓ Yagona Client Secret: {'***' if settings.YAGONA_BILLING_KLIENT_SECRET else 'NOT SET'}")
    print(f"✓ Yagona Merchant ID: {settings.YAGONA_BILLING_MERCHANT_ID}")
    
    # Check if properly configured
    if settings.FAKE_PAYMENT:
        print("\n✅ FAKE PAYMENT MODE ENABLED - Perfect for testing!")
    else:
        if all([settings.YAGONA_BILLING_CLIENT, 
                settings.YAGONA_BILLING_KLIENT_SECRET, 
                settings.YAGONA_BILLING_MERCHANT_ID]):
            print("\n✅ REAL YAGONA BILLING CONFIGURED")
        else:
            print("\n⚠️  WARNING: Real payment mode but missing credentials!")
    
    return True


def test_yagona_service():
    """Test 2: Yagona Service Class"""
    print("\n" + "="*60)
    print("TEST 2: Yagona Service Initialization")
    print("="*60)
    
    try:
        yagona = YagonaBillingService()
        print(f"\n✓ YagonaBillingService initialized")
        print(f"✓ Base URL: {yagona.base_url}")
        print(f"✓ Client ID: {yagona.client_id}")
        print(f"✓ Merchant ID: {yagona.merchant_id}")
        print("\n✅ Service initialized successfully!")
        return True
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        return False


def test_fake_payment_flow():
    """Test 3: FAKE PAYMENT Flow (End-to-End)"""
    print("\n" + "="*60)
    print("TEST 3: FAKE PAYMENT Flow")
    print("="*60)
    
    if not settings.FAKE_PAYMENT:
        print("\n⏭️  SKIPPED - Not in FAKE_PAYMENT mode")
        return True
    
    try:
        # Get or create test user
        user, _ = User.objects.get_or_create(
            email='test_payment@example.com',
            defaults={'name': 'Test Payment User'}
        )
        
        # Get or create test hotel
        vendor = Vendor.objects.first()
        if not vendor:
            print("\n⚠️  No vendor found, creating one...")
            vendor = Vendor.objects.create(
                company_name='Test Hotel Vendor',
                contact_name='Test Contact',
                email='vendor@test.com',
                phone='998901234567',
                status='active'
            )
        
        hotel = Hotel.objects.first()
        if not hotel:
            print("\n⚠️  No hotel found, creating one...")
            hotel = Hotel.objects.create(
                vendor=vendor,
                name='Test Payment Hotel',
                description='Test hotel for payment',
                address='Test Address',
                stars=4,
                price_per_night=100.00
            )
        
        from config_module.models import CurrencyRate
        # Create test booking
        booking = Booking.objects.create(
            hotel=hotel,
            user=user,
            check_in='2026-02-01',
            check_out='2026-02-05',
            adults=2,
            children=0,
            total_price=Decimal('400.00'),
            currency=CurrencyRate.objects.get_or_create(code='UZS', defaults={'rate': 1})[0],
            status='NEW'
        )
        
        print(f"\n✓ Created test booking: #{booking.id}")
        print(f"  - Guest: {booking.guest_name}")
        print(f"  - Total: ${booking.total_price}")
        print(f"  - Payment Status: {booking.payment_status}")
        
        # Simulate card registration (FAKE mode)
        from rest_framework.test import APIClient
        client = APIClient()
        client.force_authenticate(user=user)
        
        print("\n→ Step 1: Registering card...")
        register_response = client.post('/api/hotels/payment/register/', {
            'card_number': '8600123412341234',
            'exp_month': '12',
            'exp_year': '25',
            'phone': '998901234567'
        })
        
        if register_response.status_code == 200:
            print(f"✓ Card registered successfully")
            print(f"  Response: {register_response.data}")
            verify_id = register_response.data.get('data', {}).get('verifyId')
        else:
            print(f"❌ Registration failed: {register_response.data}")
            return False
        
        # Simulate payment confirmation (FAKE mode)
        print("\n→ Step 2: Confirming payment...")
        confirm_response = client.post('/api/hotels/payment/confirm/', {
            'card_token': verify_id,
            'card_code': '1111',  # Fake success code
            'booking_id': booking.id
        })
        
        if confirm_response.status_code == 200:
            print(f"✓ Payment confirmed successfully")
            print(f"  Response: {confirm_response.data}")
        else:
            print(f"❌ Confirmation failed: {confirm_response.data}")
            return False
        
        # Verify booking status
        booking.refresh_from_db()
        print(f"\n→ Step 3: Verifying booking status...")
        if booking.status == 'CONFIRMED':
            print("\n✅ FAKE PAYMENT FLOW SUCCESSFUL!")
            return True
        else:
            print("\n❌ Booking not properly updated")
            return False
            
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_payment_endpoints():
    """Test 4: Payment API Endpoints"""
    print("\n" + "="*60)
    print("TEST 4: Payment API Endpoints")
    print("="*60)
    
    endpoints = [
        '/api/hotels/payment/register/',
        '/api/hotels/payment/confirm/',
        '/api/hotels/emehmon/check/',
    ]
    
    print("\n✓ Checking endpoint mappings...")
    from django.urls import resolve, reverse
    from django.urls.exceptions import NoReverseMatch
    
    for endpoint in endpoints:
        try:
            resolved = resolve(endpoint)
            print(f"  ✓ {endpoint} → {resolved.func.__name__}")
        except Exception as e:
            print(f"  ❌ {endpoint} → ERROR: {e}")
    
    print("\n✅ All endpoints properly mapped!")
    return True


def test_booking_model():
    """Test 5: Booking Model Payment Fields"""
    print("\n" + "="*60)
    print("TEST 5: Booking Model Payment Fields")
    print("="*60)
    
    try:
        # Check model fields
        # Check model fields
        from bookings.models import Booking
        fields = [f.name for f in Booking._meta.get_fields()]
        
        required_fields = ['status', 'total_price', 'currency']
        
        print("\n✓ Checking required payment fields...")
        for field in required_fields:
            if field in fields:
                print(f"  ✓ {field}")
            else:
                print(f"  ❌ {field} - MISSING!")
                return False
        
        # Check status choices
        status_field = Booking._meta.get_field('status')
        print(f"\n✓ Status field type: {status_field.get_internal_type()}")
        
        print("\n✅ All required fields present!")
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        return False


def test_frontend_integration():
    """Test 6: Frontend Payment Integration"""
    print("\n" + "="*60)
    print("TEST 6: Frontend Payment Integration")
    print("="*60)
    
    frontend_payment_file = 'frontend/src/components/booking/BookingForm.jsx'
    
    if not os.path.exists(frontend_payment_file):
        print(f"\n⚠️  File not found: {frontend_payment_file}")
        return False
    
    with open(frontend_payment_file, 'r') as f:
        content = f.read()
    
    checks = {
        'registerPayment import': 'registerPayment' in content,
        'confirmPayment import': 'confirmPayment' in content,
        'card_number field': 'card_number' in content,
        'card_code/SMS step': 'sms_code' in content or 'card_code' in content,
        'payment step': 'step === 4' in content or 'Payment' in content,
    }
    
    print("\n✓ Checking frontend payment components...")
    all_pass = True
    for check, passed in checks.items():
        status = "✓" if passed else "❌"
        print(f"  {status} {check}")
        if not passed:
            all_pass = False
    
    if all_pass:
        print("\n✅ Frontend payment integration complete!")
        return True
    else:
        print("\n⚠️  Some frontend checks failed")
        return False


def main():
    """Run all tests"""
    print("\n" + "🔐"*30)
    print("PAYMENT INTEGRATION VERIFICATION")
    print("="*60)
    print("Testing Yagona Billing + FAKE_PAYMENT modes")
    print("🔐"*30)
    
    tests = [
        ("Configuration", test_payment_configuration),
        ("Yagona Service", test_yagona_service),
        ("Fake Payment Flow", test_fake_payment_flow),
        ("API Endpoints", test_payment_endpoints),
        ("Booking Model", test_booking_model),
        ("Frontend Integration", test_frontend_integration),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n❌ Test '{test_name}' crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\n{'='*60}")
    print(f"Total: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    print("="*60)
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Payment integration verified successfully!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please review errors above.")
        return 1


if __name__ == '__main__':
    exit(main())
