
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.db import transaction
import time
import json
import logging

from silkroad_backend.services.emehmon import EmehmonService
from silkroad_backend.services.yagona import YagonaBillingService
from vendors.models import TicketSale
from bookings.models import Booking

logger = logging.getLogger(__name__)

class PersonInfoAPIView(APIView):
    """
    Checks person info via Emehmon (MVD) database.
    POST /api/hotels/emehmon/check/
    {
        "passport": "AA1234567",
        "birthday": "1990-01-01",
        "citizen": 173
    }
    """
    permission_classes = [AllowAny] # Or IsAuthenticated depending on requirements

    def post(self, request):
        passport = request.data.get('passport')
        birthday = request.data.get('birthday')
        citizen = request.data.get('citizen')

        if not all([passport, birthday, citizen]):
             return Response({'error': 'Missing required fields'}, status=400)

        result = EmehmonService.check_person(passport, citizen, birthday)
        
        if result['status'] == 'success':
            return Response({'psp': result['psp']})
        else:
            return Response({'error': result.get('message', 'Not found')}, status=404)


class CardRegisterAPIView(APIView):
    """
    Step 1 of Payment: Register Card to get SMS code.
    POST /api/hotels/payment/register/
    {
        "card_number": "8600123412341234",
        "exp_month": "12",
        "exp_year": "25",
        "phone": "998901234567"
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # In FAKE_PAYMENT mode, we can skip real registration or simulate it
        if settings.FAKE_PAYMENT:
            return Response({
                'status': 'success',
                'message': 'Fake SMS sent (1111)',
                'data': {'verifyId': 'fake_verify_id_123', 'phone': request.data.get('phone')}
            })

        yagona = YagonaBillingService()
        result = yagona.register(
            request.data.get('card_number'),
            request.data.get('exp_month'),
            request.data.get('exp_year'),
            request.data.get('phone')
        )
        
        if result and result.get('verifyId'):
             return Response({
                 'status': 'success',
                 'message': 'SMS sent',
                 'data': result
             })
        return Response({'error': 'Card registration failed', 'details': result}, status=400)


class PaymentConfirmAPIView(APIView):
    """
    Step 2 of Payment: Verify SMS and Execute Payment.
    POST /api/hotels/payment/confirm/
    {
        "card_token": "verify_id_from_step_1",
        "card_code": "123456",
        "ticket_id": 1,  # OR "booking_id": 1
        "amount": 150000
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ticket_id = request.data.get('ticket_id')
        booking_id = request.data.get('booking_id')
        card_token = request.data.get('card_token')
        card_code = request.data.get('card_code')
        
        if not ticket_id and not booking_id:
             return Response({'error': 'Either ticket_id or booking_id is required'}, status=400)
        
        target_obj = None
        obj_type = None

        if ticket_id:
             target_obj = get_object_or_404(TicketSale, pk=ticket_id, created_by=request.user)
             obj_type = 'ticket'
             if target_obj.payment_status == 'paid':
                  return Response({'error': 'Ticket already paid'}, status=400)
             amount_to_pay = target_obj.total_amount
        else:
             target_obj = get_object_or_404(Booking, pk=booking_id, user=request.user)
             obj_type = 'booking'
             if target_obj.status == 'CONFIRMED':
                  return Response({'error': 'Booking already paid'}, status=400)
             amount_to_pay = target_obj.total_price

        # FAKE PAYMENT MODE
        if settings.FAKE_PAYMENT:
            if card_code == '1111': # Fake success code
                 self.mark_as_paid(target_obj, obj_type)
                 return Response({
                     'status': 'success',
                     'message': 'Fake Payment Successful',
                     'transaction': {'id': 'fake_trans_999'}
                 })
            return Response({'error': 'Invalid SMS code (use 1111)'}, status=400)

        # REAL PAYMENT
        yagona = YagonaBillingService()
        
        # 1. Verify Card
        verify_result = yagona.verify(card_token, card_code)
        if not verify_result or not verify_result.get('token'):
             return Response({'error': 'SMS verification failed', 'details': verify_result}, status=400)
             
        local_token = verify_result['token']
        
        # 2. Execute Payment
        pay_result = yagona.pay(
            token=local_token,
            amount=amount_to_pay,
            order_id=target_obj.id,
            note=f"{obj_type.capitalize()} #{target_obj.id}"
        )
        
        if pay_result and pay_result.get('transactionId'):
             # Success
             with transaction.atomic():
                 self.mark_as_paid(target_obj, obj_type)
                 
             return Response({
                 'status': 'success',
                 'message': 'Payment Successful',
                 'transaction': pay_result
             })
             
        return Response({'error': 'Payment failed', 'details': pay_result}, status=400)

    def mark_as_paid(self, obj, obj_type):
        if obj_type == 'ticket':
            obj.payment_status = 'paid'
            obj.save()
        elif obj_type == 'booking':
            obj.mark_as_paid() # Use the method from Booking model
