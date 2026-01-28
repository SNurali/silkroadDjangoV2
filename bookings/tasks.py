from celery import shared_task
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=5, default_retry_delay=60)
def send_booking_to_emehmon_task(self, booking_id):
    """
    Async task to send booking to E-mehmon (Phase 3).
    """
    from bookings.models import Booking
    from integrations.emehmon.client import EMehmonAPIClient
    
    try:
        booking = Booking.objects.get(id=booking_id)
        # Avoid duplicate sending if already has external ID
        if booking.emehmon_id:
             logger.info(f"Booking {booking_id} already has emehmon_id: {booking.emehmon_id}")
             return f"Skipped: Already synced ({booking.emehmon_id})"

        client = EMehmonAPIClient()
        logger.info(f"Processing booking {booking_id} for E-mehmon...")
        
        data = client.create_booking(booking)
        
        # Update booking with external ID
        # Assuming API returns 'booking_id' key
        external_id = data.get('booking_id') or data.get('id')
        
        if external_id:
            booking.emehmon_id = external_id
            booking.status = 'PENDING' # Or whatever logic dictates
            booking.save(update_fields=['emehmon_id', 'status'])
            return f"Success: Booking synced to E-mehmon (ID: {external_id})"
        else:
             logger.error(f"E-mehmon response missing ID: {data}")
             raise ValueError("No booking ID in response")

    except Exception as e:
        logger.error(f"Error sending booking {booking_id}: {e}")
        raise self.retry(exc=e)

@shared_task
def sync_booking_status_task(booking_id):
    """
    Async task to sync status from E-mehmon.
    """
    logger.info(f"Syncing status for booking {booking_id}...")
    # TODO: Implement in Phase 3
    return "Synced (SIMULATED)"
