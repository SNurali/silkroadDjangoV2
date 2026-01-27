import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class EMehmonClient:
    """
    Клиент для интеграции с государственной системой e-mehmon.
    """
    def __init__(self):
        self.base_url = settings.PERSON_INFO_API
        self.foreign_url = settings.PERSON_INFO_FOREIGN_API
        self.secret = settings.PERSON_INFO_SECRET

    def _get_headers(self):
        return {
            "Authorization": f"Bearer {self.secret}",
            "Accept": "application/json"
        }

    def search_hotels(self, region_id=None, stars=None):
        """
        Поиск гостиниц через API e-mehmon.
        """
        params = {}
        if region_id: params['region_id'] = region_id
        if stars: params['stars'] = stars
        
        try:
            response = requests.get(f"{self.base_url}/hotels", params=params, headers=self._get_headers())
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error searching hotels in e-mehmon: {e}")
            return []

    def get_room_availability(self, hotel_id, check_in, check_out):
        """
        Получение доступных номеров.
        """
        params = {
            "hotel_id": hotel_id,
            "check_in": check_in,
            "check_out": check_out
        }
        try:
            response = requests.get(f"{self.base_url}/rooms", params=params, headers=self._get_headers())
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error getting room availability: {e}")
            return []

    def create_booking_request(self, booking_data):
        """
        Отправка запроса на бронирование в e-mehmon.
        """
        try:
            response = requests.post(
                f"{self.base_url}/bookings", 
                json=booking_data, 
                headers=self._get_headers()
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error creating booking in e-mehmon: {e}")
            return None

    def get_foreigner_data(self, passport_number):
        """
        Получение данных иностранца (въезд, виза, нарушения).
        """
        try:
            response = requests.get(
                f"{self.foreign_url}/status", 
                params={"passport": passport_number}, 
                headers=self._get_headers()
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error getting foreigner data: {e}")
            return None
