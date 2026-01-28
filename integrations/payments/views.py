from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import logging
from payments.models import Payment

logger = logging.getLogger(__name__)

class YagonaWebhookView(APIView):
    """
    Receives payment status updates from Yagona.
    """
    permission_classes = []

    def post(self, request):
        # TODO: Verify Signature (HMAC)
        # verify_signature(request)
        
        try:
            payment_id = request.data.get("order_id")
            new_status = request.data.get("status")

            if not payment_id:
                return Response({"error": "Missing order_id"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                payment = Payment.objects.get(id=payment_id)
            except Payment.DoesNotExist:
                 logger.error(f"Payment {payment_id} not found via webhook.")
                 return Response({"error": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)

            logger.info(f"Payment Webhook: ID {payment_id}, Status {new_status}")

            if new_status == "success":
                payment.status = Payment.Status.PAID
                payment.save(update_fields=["status"])
                
                # Update related object (Booking, Ticket)
                if hasattr(payment.related_object, 'mark_as_paid'):
                    payment.related_object.mark_as_paid()
                else:
                    logger.warning(f"Related object {payment.related_object} has no mark_as_paid method")

            elif new_status == "failed":
                payment.status = Payment.Status.FAILED
                payment.save(update_fields=["status"])
            
            # Add other statuses as needed

            return Response({"ok": True})

        except Exception as e:
            logger.error(f"Payment webhook error: {e}")
            return Response({"error": "Internal Error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
