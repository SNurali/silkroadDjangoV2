import requests
import logging
from django.conf import settings
from rest_framework.exceptions import APIException

logger = logging.getLogger(__name__)

class EMehmonAPIClient:
    """
    Enterprise API Client for E-mehmon (MVD) Integration.
    Handles authentication, error handling, and timeout logic.
    """
    def __init__(self):
        self.base_url = settings.PERSON_INFO_API or "https://api.emehmon.uz/api/v1"
        self.api_key = settings.PERSON_INFO_SECRET
        self.timeout = 15  # Strict timeout for enterprise standards

    def _headers(self):
        if not self.api_key:
            logger.warning("EMEHMON_API_KEY is not set!")
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-Client-ID": "SILKROAD_PLATFORM"
        }

    def _handle_error(self, response, context):
        """Standardized error handling"""
        try:
            error_data = response.json()
        except:
            error_data = response.text

        logger.error(f"E-Mehmon API Error [{context}]: {response.status_code} - {error_data}")
        response.raise_for_status()

    def create_booking(self, booking):
        """
        Registers a new booking in the E-mehmon system.
        Endpoint: POST /bookings (Hypothetical Enterprise Endpoint)
        """
        # Map internal model to external API schema
        payload = {
            "external_id": str(booking.id),
            "hotel_id": booking.hotel.emehmon_id,
            "room_type_id": booking.room_type.emehmon_id if booking.room_type else None,
            "check_in": booking.check_in.isoformat(),
            "check_out": booking.check_out.isoformat(),
            "guests_count": {
                "adults": booking.adults,
                "children": booking.children,
            },
            "primary_guest": {
                "full_name": booking.user.get_full_name(),
                "email": booking.user.email,
                "phone": booking.user.phone,
                "passport": getattr(booking.user, 'passport', None), # Assuming User model has this
            }
        }

        url = f"{self.base_url}/bookings"
        logger.info(f"Sending Booking #{booking.id} to E-mehmon: {url}")

        try:
            response = requests.post(
                url,
                json=payload,
                headers=self._headers(),
                timeout=self.timeout
            )
            
            if response.status_code != 201 and response.status_code != 200:
                self._handle_error(response, "create_booking")
            
            return response.json()

        except requests.exceptions.RequestException as e:
            logger.error(f"Network error sending booking {booking.id}: {e}")
            raise APIException(f"E-mehmon unreachable: {str(e)}")

    def get_foreign_status(self, passport_number, citizenship_id=None):
        """
        Checks visa and registration status for a foreigner.
        Endpoint: GET /foreigners/{passport}
        """
        url = f"{self.base_url}/foreigners/{passport_number}"
        params = {}
        if citizenship_id:
            params['country_id'] = citizenship_id

        try:
            response = requests.get(
                url,
                params=params,
                headers=self._headers(),
                timeout=self.timeout
            )
            
            if response.status_code != 200:
                self._handle_error(response, "get_foreign_status")
                
            return response.json()

        except requests.exceptions.RequestException as e:
            logger.error(f"Network error checking foreigner {passport_number}: {e}")
            raise APIException(f"E-mehmon check failed: {str(e)}")
