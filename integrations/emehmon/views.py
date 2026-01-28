from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import logging
from bookings.models import Booking, BookingStatusHistory
# from accounts.models import ForeignProfileData  <-- Might use later for webhook updates on profile

logger = logging.getLogger(__name__)

class EMehmonWebhookView(APIView):
    """
    Receives status updates from E-mehmon system.
    Secured by HMAC signature verification (mocked for now, needs real secret).
    """
    permission_classes = [] # Signature check handles auth

    def post(self, request):
        # 1. Verify Signature (TODO: Implement real HMAC verification)
        signature = request.headers.get("X-Signature")
        # verify_signature(signature, request.body) 
        
        try:
            external_id = request.data.get("booking_id")
            new_status_code = request.data.get("status")
            
            if not external_id or not new_status_code:
                return Response({"error": "Missing booking_id or status"}, status=status.HTTP_400_BAD_REQUEST)

            logger.info(f"Received Webhook for Booking {external_id}: Status {new_status_code}")

            # 2. Find Booking
            try:
                booking = Booking.objects.get(emehmon_id=external_id)
            except Booking.DoesNotExist:
                 # It might be in the legacy table or just not found
                 logger.warning(f"Booking with emehmon_id {external_id} not found.")
                 return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)

            # 3. Map Status
            # Map external status codes to internal choices
            STATUS_MAP = {
                "CONFIRMED": "CONFIRMED",
                "REJECTED": "REJECTED",
                "CHECKED_IN": "COMPLETED", # Example mapping
                "CANCELLED": "CANCELLED"
            }
            
            internal_status = STATUS_MAP.get(new_status_code)
            if not internal_status:
                logger.warning(f"Unknown status code: {new_status_code}")
                return Response({"ok": True, "warning": "Unknown status ignored"})

            # 4. Update Booking
            if booking.status != internal_status:
                old_status = booking.status
                booking.status = internal_status
                booking.save(update_fields=["status"])
                
                # 5. Log History
                BookingStatusHistory.objects.create(
                    booking=booking,
                    status=internal_status,
                    comment=f"Updated via E-mehmon Webhook (Code: {new_status_code})",
                    changed_by=None # System update
                )

            return Response({"ok": True})

        except Exception as e:
            logger.error(f"Webhook processing error: {e}")
            return Response({"error": "Internal Server Error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
