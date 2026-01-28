from celery import shared_task
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=5)
def create_yagona_payment_task(self, payment_id):
    from integrations.payments.yagona_client import YagonaPaymentClient
    from payments.models import Payment

    try:
        payment = Payment.objects.get(id=payment_id)
        client = YagonaPaymentClient()

        # Call Yagona API
        data = client.create_payment(payment)
        
        # Update Payment with external ID and processing status
        # Assuming Yagona returns 'payment_id' or similar
        external_id = data.get("payment_id")
        
        if external_id:
            payment.external_payment_id = external_id
            payment.status = Payment.Status.PROCESSING
            payment.save(update_fields=["external_payment_id", "status"])
        else:
            # Handle mock or unexpected response structure
            logger.warning(f"No payment_id returned from Yagona for Payment {payment_id}. Data: {data}")

    except Exception as e:
        logger.error(f"Error creating payment {payment_id}: {e}")
        raise self.retry(exc=e, countdown=60)
