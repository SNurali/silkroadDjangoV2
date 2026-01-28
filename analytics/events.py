from django.utils import timezone
from .tasks import sync_event_to_clickhouse_task

def send_booking_event(booking, status_override=None):
    """
    Sends a booking event to ClickHouse.
    """
    data = {
        'event_time': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
        'booking_id': booking.id,
        'user_id': booking.user.id if booking.user else 0,
        'vendor_id': booking.hotel.vendor.id if booking.hotel and booking.hotel.vendor else 0,
        'booking_type': 'hotel',
        'status': status_override or booking.status,
        'amount': float(booking.total_price),
        'currency': booking.currency.code if booking.currency else 'UZS',
        'region': booking.hotel.region.name if booking.hotel and booking.hotel.region else 'Unknown',
        'created_at': booking.created_at.strftime('%Y-%m-%d %H:%M:%S')
    }
    sync_event_to_clickhouse_task.delay('booking_events', data)

def send_ticket_sale_event(ticket_sale):
    """
    Sends a ticket sale event to ClickHouse.
    """
    data = {
        'event_time': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
        'ticket_sale_id': ticket_sale.id,
        'vendor_id': ticket_sale.vendor.id if ticket_sale.vendor else 0,
        'service_id': ticket_sale.sight.id if ticket_sale.sight else 0,
        'customer_id': ticket_sale.created_by.id if ticket_sale.created_by else 0,
        'amount': float(ticket_sale.total_amount),
        'currency': 'UZS', # Domestic usually
        'quantity': ticket_sale.total_qty,
        'region': ticket_sale.sight.region.name if ticket_sale.sight and ticket_sale.sight.region else 'Unknown'
    }
    sync_event_to_clickhouse_task.delay('ticket_sales_events', data)
