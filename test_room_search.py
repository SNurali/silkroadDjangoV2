#!/usr/bin/env python3
"""
Test script for Room Search API
Tests the new availability checking logic
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/hotels"

def test_room_search():
    """Test room search with date-based availability"""
    
    # Test data
    hotel_id = 1  # Change to existing hotel ID
    check_in = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
    check_out = (datetime.now() + timedelta(days=3)).strftime('%Y-%m-%d')
    
    payload = {
        "check_in": check_in,
        "check_out": check_out,
        "adults": 2,
        "children": 0,
        "rooms": 1
    }
    
    print(f"\n🔍 Testing Room Search API")
    print(f"Hotel ID: {hotel_id}")
    print(f"Check-in: {check_in}")
    print(f"Check-out: {check_out}")
    print(f"Guests: {payload['adults']} adults, {payload['children']} children")
    print(f"Rooms requested: {payload['rooms']}")
    print("=" * 60)
    
    try:
        response = requests.post(
            f"{API_URL}/{hotel_id}/search-rooms/",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\n✅ Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"\n📊 Results:")
            print(f"  - Hotel: {data['hotel']['name']}")
            print(f"  - Available room types: {data['total_room_types']}")
            print(f"  - Nights: {data['search_params']['nights']}")
            
            print(f"\n🏨 Room Details:")
            for room in data['rooms']:
                print(f"\n  Room Type: {room['room_type']}")
                print(f"    - Capacity: {room['capacity']} guests")
                print(f"    - Price per night: ${room['price_per_night_usd']}")
                print(f"    - Total price: ${room['total_price_usd']}")
                print(f"    - Available: {room['available_count']} rooms")
                print(f"    - Can fulfill request: {'✅ Yes' if room['can_fulfill_request'] else '❌ No'}")
                
                features = []
                if room['features']['wifi']:
                    features.append('WiFi')
                if room['features']['aircond']:
                    features.append('AC')
                if room['features']['tvset']:
                    features.append('TV')
                if room['features']['freezer']:
                    features.append('Fridge')
                
                if features:
                    print(f"    - Features: {', '.join(features)}")
            
            print("\n" + "=" * 60)
            print("✅ Room search test PASSED!")
            
        else:
            print(f"\n❌ Error: {response.status_code}")
            print(response.json())
            
    except requests.exceptions.ConnectionError:
        print("\n❌ Connection Error: Is the Django server running?")
        print("   Run: python3 manage.py runserver")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")

if __name__ == "__main__":
    test_room_search()
