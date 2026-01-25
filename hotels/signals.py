from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
import logging
from .models import Booking

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Booking)
def booking_notification(sender, instance, created, **kwargs):
    """
    Sends notifications when a booking is created or status changes.
    """
    if created:
        # 1. Notify User (Welcome/Pending)
        try:
            send_mail(
                subject=f'Booking Received - #{instance.id}',
                message=f'Dear {instance.guest_name},\n\nYour booking at {instance.hotel.name} has been received and is pending confirmation.\n\nCheck-in: {instance.check_in}\nCheck-out: {instance.check_out}\n\nThank you for choosing SilkRoad.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[instance.guest_email],
                fail_silently=True
            )
        except Exception as e:
            logger.error(f"Failed to send user pending email: {str(e)}")

        # 2. Notify Vendor (New Booking)
        if instance.hotel.created_by and instance.hotel.created_by.email:
             try:
                send_mail(
                    subject=f'New Booking Request - #{instance.id}',
                    message=f'Hello,\n\nYou have a new booking request for {instance.hotel.name}.\nGuest: {instance.guest_name}\nDates: {instance.check_in} to {instance.check_out}.\n\nPlease login to your dashboard to confirm or reject.',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[instance.hotel.created_by.email],
                    fail_silently=True
                )
             except Exception as e:
                logger.error(f"Failed to send vendor notification: {str(e)}")

    else:
        # Status Change Logic (Pending -> Confirmed / Cancelled)
        if instance.booking_status == 'confirmed':
             # Notify User of Confirmation
             try:
                send_mail(
                    subject=f'Booking Confirmed! - #{instance.id}',
                    message=f'Dear {instance.guest_name},\n\nGood news! Your booking at {instance.hotel.name} has been CONFIRMED.\n\nWe look forward to hosting you.',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[instance.guest_email],
                    fail_silently=True
                )
             except Exception as e:
                logger.error(f"Failed to send confirmation email: {str(e)}")
