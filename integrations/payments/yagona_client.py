import requests
import logging
from django.conf import settings
from rest_framework.exceptions import APIException

logger = logging.getLogger(__name__)

class YagonaPaymentClient:
    """
    Client for VIA/Yagona Payment System.
    """
    def __init__(self):
        self.base_url = getattr(settings, 'YAGONA_BASE_URL', 'https://api.yagona.uz/v1') # Fallback or env
        self.merchant_id = settings.YAGONA_BILLING_MERCHANT_ID
        self.secret_key = settings.YAGONA_BILLING_KLIENT_SECRET
        self.timeout = 15

    def create_payment(self, payment):
        """
        Initiates a payment transaction.
        """
        webhook_url = getattr(settings, 'YAGONA_WEBHOOK_URL', 'https://silkroad.uz/api/integrations/payments/webhook/')
        
        payload = {
            "merchant_id": self.merchant_id,
            "amount": str(payment.amount),
            "currency": payment.currency,
            "callback_url": webhook_url,
            "order_id": str(payment.id),
            "description": f"Payment for {payment.related_object} (ID: {payment.object_id})"
        }

        # logger.info(f"Creating Yagona payment for Order {payment.id}: {self.base_url}")
        
        # NOTE: Using a mock approach if FAKE_PAYMENT is on, per legacy settings logic, 
        # but the prompt asked for "Enterprise Integration". 
        # However, without real creds, a real call might fail.
        # Im implementing the REAL call as requested.
        
        try:
            if getattr(settings, 'FAKE_PAYMENT', False):
                 logger.info("FAKE_PAYMENT mode enabled. Returning mock Yagona response.")
                 return {"payment_id": f"fake_yagona_{payment.id}", "url": "https://yagona.uz/pay/fake"}

            response = requests.post(f"{self.base_url}/payments", json=payload, timeout=self.timeout)
            response.raise_for_status()
            return response.json()

        except requests.exceptions.RequestException as e:
            logger.error(f"Yagona API Error: {e}")
            raise APIException(f"Payment provider unavailable: {str(e)}")
