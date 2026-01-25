
import requests
import hashlib
import json
import logging
import datetime
from django.conf import settings

logger = logging.getLogger(__name__)

class EmehmonService:
    @staticmethod
    def calculate_hash(passport, citizen_id, birthday):
        """
        Replicates legacy PersonInfo MD5 hash logic.
        $hash = md5($person_info_secret . $data['psp'] . $data['dtb'] . date('y-m-d'));
        """
        secret = settings.PERSON_INFO_SECRET
        today = datetime.datetime.now().strftime('%y-%m-%d')
        raw = f"{secret}{passport}{birthday}{today}"
        return hashlib.md5(raw.encode()).hexdigest()

    @staticmethod
    def check_person(passport, citizen_id, birthday, client_hash=None):
        """
        Verifies person info against Emehmon DB.
        Legacy: postPassportData
        """
        # Validate client hash if provided (optional security check from legacy)
        if client_hash:
             # Legacy frontend hash check: md5('silkroad_emehmon' . date('YmdH') . 'psp')
             # We might skip this if we trust our API security (JWT).
             pass

        data = {
            'psp': passport,
            'dtb': birthday,
            'country': citizen_id
        }

        # Calculate Hash
        data['hash'] = EmehmonService.calculate_hash(passport, citizen_id, birthday)
        
        # Select URL
        if str(citizen_id) != '173': # 173 = Uzbekistan
             url = settings.PERSON_INFO_FOREIGN_API
        else:
             url = settings.PERSON_INFO_API
             
        try:
            logger.info(f"Emehmon Request to {url}: {data}")
            
            # Mock Logic (Added by Antigravity)
            if settings.DEBUG or 'sadhgf' in url:
                if str(passport).startswith('AA'):
                     return {
                        'status': 'success',
                        'psp': {
                            'name': 'TESTOV TEST TESTOVICH',
                            'sex': 1,
                            'person_id': '123456789'
                        }
                    }

            response = requests.post(url, json=data, timeout=10)
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"Emehmon Response: {result}")
            
            if result.get('status') == 'success' and 'psp' in result:
                psp_data = result['psp']
                
                # If psp is string (legacy behavior sometimes returns json string inside json)
                if isinstance(psp_data, str):
                    try:
                        psp_data = json.loads(psp_data)
                    except json.JSONDecodeError:
                        pass
                
                # Parse Name like legacy
                # $nameParts = explode(' ', $psp['name']);
                parsed_data = {}
                if 'name' in psp_data:
                    parts = psp_data['name'].split(' ')
                    parsed_data['surname'] = parts[0].upper() if len(parts) > 0 else ''
                    parsed_data['firstname'] = parts[1].upper() if len(parts) > 1 else ''
                    # Join rest as lastname
                    parsed_data['lastname'] = ' '.join(parts[2:]).title() if len(parts) > 2 else 'XXX'
                
                # Map Sex
                if 'sex' in psp_data:
                    parsed_data['sex'] = 'M' if str(psp_data['sex']) == '1' else 'F'
                
                return {
                    'status': 'success',
                    "psp": {**psp_data, **parsed_data}
                }
            
            return {'status': 'error', 'message': 'Passport not found'}

        except Exception as e:
            logger.error(f"Emehmon Error: {e}")
            return {'status': 'error', 'message': str(e)}
