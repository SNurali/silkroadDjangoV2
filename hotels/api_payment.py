from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
import uuid
import random
from .models import Booking

# Mock Payment Logic (replace with Yagona/Click client if keys provided)
class PaymentRegisterView(APIView):
    """
    Step 1: Register Card.
    Returns `verify_id` (session id) for SMS confirmation.
    """
    def post(self, request):
        card_number = request.data.get('card_number')
        exp_month = request.data.get('exp_month')
        exp_year = request.data.get('exp_year')
        phone = request.data.get('phone')

        if not all([card_number, exp_month, exp_year]):
            return Response({'message': 'Missing card data'}, status=status.HTTP_400_BAD_REQUEST)

        # Mock Logic: Generate a fake verifyId
        # In real world: Call Yagona API -> Register Card -> Get ID
        verify_id = str(uuid.uuid4())
        
        # Here we validly behave like we sent an SMS
        # Send SMS code (Mock: Log it)
        print(f"DTO [Mock SMS]: Sending code 1111 to {phone} for verify_id {verify_id}")

        return Response({
            'verifyId': verify_id,
            'message': 'SMS code sent'
        })

class PaymentConfirmView(APIView):
    """
    Step 2: Confirm Payment.
    Validates SMS code and marking booking as paid.
    """
    def post(self, request):
        card_token = request.data.get('card_token') # verifyId
        card_code = request.data.get('card_code')
        booking_id = request.data.get('booking_id')

        if not booking_id:
             return Response({'message': 'Booking ID required'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate Code (Mock: '1111')
        if card_code != '1111':
            return Response({'message': 'Invalid SMS Code'}, status=status.HTTP_400_BAD_REQUEST)

        # Mark Booking as Paid
        booking = get_object_or_404(Booking, id=booking_id)
        
        # In real world: Call Yagona API -> Confirm(card_token, code, amount=booking.total_price)
        # If success:
        booking.payment_status = 'paid'
        booking.booking_status = 'confirmed'
        booking.save()

        return Response({
            'success': True,
            'message': 'Payment Successful'
        })
