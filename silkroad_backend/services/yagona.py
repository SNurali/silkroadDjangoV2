
import requests
import json
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class YagonaBillingService:
    def __init__(self):
        self.client_id = settings.YAGONA_BILLING_CLIENT
        self.client_secret = settings.YAGONA_BILLING_KLIENT_SECRET
        self.merchant_id = settings.YAGONA_BILLING_MERCHANT_ID
        self.base_url = "https://api.viasandbox.uz"  # or read from env if needed

    def _request(self, endpoint, data):
        headers = {
            'client-id': self.client_id,
            'client-secret': self.client_secret,
            'Content-Type': 'application/json'
        }
        url = f"{self.base_url}{endpoint}"
        
        try:
            logger.info(f"Yagona Request {endpoint}: {data}")
            response = requests.post(url, json=data, headers=headers, timeout=30, verify=False) # verify=False from legacy
            
            result = response.json()
            logger.info(f"Yagona Response {endpoint}: {result} Code: {response.status_code}")
            return result
        except Exception as e:
            logger.error(f"Yagona Error: {e}")
            return {'status': 'error', 'message': str(e)}

    def register(self, card_number, exp_month, exp_year, phone):
        """
        Legacy: register($data)
        Endpoint: /card/api/v1/card/register
        """
        payload = {
            "pan": str(card_number).replace(" ", ""),
            "expMonth": str(exp_month),
            "expYear": str(exp_year),
            "phone": str(phone)
        }
        return self._request("/card/api/v1/card/register", payload)

    def verify(self, verify_id, code):
        """
        Legacy: verify($data)
        Endpoint: /card/api/v1/card/register/verify
        """
        payload = {
            "verifyId": verify_id,
            "verifyCode": str(code)
        }
        return self._request("/card/api/v1/card/register/verify", payload)

    def pay(self, token, amount, order_id, note="Payment"):
        """
        Legacy: pay($data)
        Endpoint: /ps/api/v1/pvpay/partner/pay
        """
        # Legacy calculation: amount * 100 for tiyin? 
        # In PaymentController: "amount" => $data['trans_amount'] * 100
        
        payload = {
            "merchantId": self.merchant_id,
            "localToken": token,
            "externalId": f"{order_id}_{int(datetime.datetime.now().timestamp())}", 
            "amount": int(amount * 100), # Convert to tiyin
            "currency": "UZS",
            "note": note,
            "metadata": {
                "order_id": order_id
            }
        }
        return self._request("/ps/api/v1/pvpay/partner/pay", payload)

import datetime
