from django.db.models.signals import post_save
from django.dispatch import receiver
from bookings.models import Booking
from vendors.models import TicketSale
from .events import send_booking_event, send_ticket_sale_event

@receiver(post_save, sender=Booking)
def booking_analytics_signal(sender, instance, created, **kwargs):
    """
    Triggers on Booking save.
    """
    # For MVP, we send event on every status change or creation
    send_booking_event(instance)

@receiver(post_save, sender=TicketSale)
def ticket_sale_analytics_signal(sender, instance, created, **kwargs):
    """
    Triggers on TicketSale save.
    """
    send_ticket_sale_event(instance)
