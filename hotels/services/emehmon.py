import hashlib
import json
import logging
import datetime
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

class EMehmonService:
    """
    Port of Laravel App\Services\PersonInfo.php
    Handles communication with E-Mehmon / MVD External API for passport verification.
    """

    def __init__(self):
        self.secret = getattr(settings, 'PERSON_INFO_SECRET', 'secret_key_silkroad')
        # Fix: Use PERSON_INFO_API to match settings.py
        self.api_url = getattr(settings, 'PERSON_INFO_API', 'https://api.emehmon.uz/api/v1/person/info') 
        self.foreign_api_url = getattr(settings, 'PERSON_INFO_FOREIGN_API', 'https://api.emehmon.uz/api/v1/person/foreign')
        
        print(f"DEBUG: EMehmon SERVICE INIT. DEBUG={settings.DEBUG}, URL={self.api_url}") # Debug Log

    def check_person_info(self, passport, birthday, citizen_id, client_hash):
        """
        Verifies person info against the external API.
        
        Args:
            passport (str): Passport Serial Number
            birthday (str): Date of Birth (YYYY-MM-DD)
            citizen_id (int): Citizenship ID (173 for Uzbekistan)
            client_hash (str): Hash provided by frontend for security check
        
        Returns:
            dict: { 'success': bool, 'data': dict, 'message': str }
        """
        
        # 1. Verify Request Hash (Security check similar to Laravel)
        # Laravel: if ($hash != $request->input('ch_info')) return false;
        # Hash format: md5('silkroad_emehmon' . date('YmdH') . 'psp')
        
        current_hour_str = datetime.datetime.now().strftime('%Y%m%d%H')
        expected_raw = f"silkroad_emehmon{current_hour_str}psp"
        expected_hash = hashlib.md5(expected_raw.encode()).hexdigest()
        
        # Note: In production we might want to check previous hour too to handle boundary conditions
        if client_hash != expected_hash:
            # Check previous hour in case of clock skew
            prev_hour_str = (datetime.datetime.now() - datetime.timedelta(hours=1)).strftime('%Y%m%d%H')
            expected_raw_prev = f"silkroad_emehmon{prev_hour_str}psp"
            expected_hash_prev = hashlib.md5(expected_raw_prev.encode()).hexdigest()
            
            if client_hash != expected_hash_prev:
                 return {'success': False, 'message': 'Invalid security hash.', 'code': 403}

        # 2. Prepare Data for External API
        data = {
            'psp': passport,
            'dtb': birthday,
            'country': citizen_id
        }
        
        api_response = self._reach_data_from_mvd(data)
        
        if not api_response:
             return {'success': False, 'message': 'External API unavailable.', 'code': 503}
             
        # 3. Parse Response (Ported from logic)
        # Laravel: if (isset($response['psp']) && is_string($response['psp'])) ...
        
        psp_data = api_response.get('psp')
        
        # Handle stringified JSON if necessary (Laravel code checked is_string)
        if isinstance(psp_data, str):
            try:
                psp_data = json.loads(psp_data)
            except json.JSONDecodeError:
                return {'success': False, 'message': 'Invalid data from external API.', 'code': 502}

        if api_response.get('status') == 'success' and psp_data and 'name' in psp_data:
            # Parse Name Parts
            name_parts = psp_data['name'].split()
            
            parsed_psp = {
                'surname': name_parts[0].upper() if len(name_parts) > 0 else '',
                'firstname': name_parts[1].upper() if len(name_parts) > 1 else '',
                'lastname': ' '.join(name_parts[2:]).title() if len(name_parts) > 2 else 'XXX',
                'sex': 'M' if str(psp_data.get('sex')) == '1' else 'F',
                'person_id': psp_data.get('person_id', ''),
                'raw_data': psp_data # Keep raw data just in case
            }
            
            return {'success': True, 'data': parsed_psp}
            
        return {'success': False, 'message': 'Person not found.', 'code': 404}

    def get_foreigner_full_data(self, passport, citizenship_id):
        """
        Fetches detailed foreigner status (visa, entry date, violations).
        """
        data = {
            'psp': passport,
            'country': citizenship_id
        }
        
        # In reality, this might be a different endpoint
        url = self.foreign_api_url
        
        try:
           # TODO: REAL API REQUIRED (Phase 3)
           # Ensure we only use real endpoints
             response = requests.post(url, json=data, timeout=10)
             response.raise_for_status()
             return {'success': True, 'data': response.json()}
        except Exception as e:
            logger.error(f"EMehmon Foreigner API Error: {str(e)}")
            return {'success': False, 'message': str(e)}

    def sync_hotel_availability(self, hotel_emehmon_id, start_date, end_date):
        """
        Syncs room availability for a specific hotel from e-mehmon.
        """
        logger.info(f"Syncing availability for hotel {hotel_emehmon_id}")
        # TODO: REAL API REQUIRED (Phase 3)
        # raise NotImplementedError("Real API for sync_hotel_availability not implemented yet")
        return {'success': False, 'message': 'REAL API REQUIRED'}

    def sync_booking_status(self, emehmon_booking_id):
        """
        Pulls the latest status of a booking from e-mehmon.
        """
        logger.info(f"Syncing status for booking {emehmon_booking_id}")
        # TODO: REAL API REQUIRED (Phase 3)
        # raise NotImplementedError("Real API for sync_booking_status not implemented yet")
        return {'success': False, 'message': 'REAL API REQUIRED'}

    def _reach_data_from_mvd(self, data):
        """
        Sends request to external MVD API.
        """
        today_str = datetime.datetime.now().strftime('%y-%m-%d')
        
        raw_hash = f"{self.secret}{data['psp']}{data.get('dtb', '')}{today_str}"
        data['hash'] = hashlib.md5(raw_hash.encode()).hexdigest()
        
        url = self.api_url if str(data.get('country')) == '173' else self.foreign_api_url
        
        try:
            if settings.DEBUG or 'sadhgf' in url:
                return self._mock_response(data)

            response = requests.post(url, json=data, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"MVD API Error: {str(e)}")
            return None

    def _mock_response(self, data):
        """Mock response for testing purposes"""
        # TODO: REAL API REQUIRED (Phase 3)
        # return {'status': 'error', 'message': 'Mock data disabled in Enterprise Mode'}
        return {'status': 'error', 'message': 'REAL API REQUIRED'}
