from payments.models import Payment
from payments.tasks import create_yagona_payment_task
from django.contrib.contenttypes.models import ContentType

def create_payment_for_booking(booking):
    """
    Creates a Payment record for a booking and initiates the Yagona transaction task.
    """
    payment = Payment.objects.create(
        user=booking.user,
        amount=booking.total_price,
        currency="UZS", # Assuming base currency
        content_type=ContentType.objects.get_for_model(booking),
        object_id=booking.id,
    )
    
    # Trigger Async Task
    create_yagona_payment_task.delay(payment.id)
    return payment
