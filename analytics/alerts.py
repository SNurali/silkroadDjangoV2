from .schema import get_client
from notifications.models import Notification
from accounts.models import User
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

def check_cancellation_surge():
    """
    Detects if any region or vendor has a cancellation surge (>20% last 24h).
    """
    client = get_client()
    query = '''
        SELECT 
            vendor_id, 
            countIf(status = 'cancelled') as cancels, 
            count() as total,
            cancels / total as rate
        FROM booking_events
        WHERE event_time >= now() - INTERVAL 1 DAY
        GROUP BY vendor_id
        HAVING total > 5 AND rate > 0.2
    '''
    try:
        results = client.execute(query)
        if results:
            admins = User.objects.filter(is_staff=True)
            for row in results:
                vendor_id, cancels, total, rate = row
                for admin in admins:
                    Notification.objects.create(
                        user=admin,
                        title="🚨 Cancellation Surge Detected",
                        message=f"Vendor ID {vendor_id} has a {rate:.1%} cancellation rate ({cancels}/{total}) in the last 24 hours.",
                        type="error",
                        link=f"/admin/vendors/{vendor_id}/"
                    )
    except Exception as e:
        logger.error(f"Error checking cancellation surge: {e}")

def check_sales_drop():
    """
    Detects if total revenue dropped by >50% compared to previous 7-day average.
    """
    client = get_client()
    # Revenue today vs avg revenue per day last 7 days
    query = '''
        WITH 
        (SELECT sum(amount) / 7 FROM booking_events WHERE event_time >= now() - INTERVAL 8 DAY AND event_time < now() - INTERVAL 1 DAY) as avg_revenue,
        (SELECT sum(amount) FROM booking_events WHERE event_time >= now() - INTERVAL 1 DAY) as today_revenue
        SELECT today_revenue, avg_revenue, (today_revenue / avg_revenue) as ratio
        WHERE avg_revenue > 0 AND ratio < 0.5
    '''
    try:
        results = client.execute(query)
        if results:
            today, avg, ratio = results[0]
            admins = User.objects.filter(is_staff=True)
            for admin in admins:
                Notification.objects.create(
                    user=admin,
                    title="📉 Sales Drop Alert",
                    message=f"Revenue in the last 24h ({today:,.0f} UZS) is significantly lower than average ({avg:,.0f} UZS).",
                    type="warning",
                    link="/admin/analytics/"
                )
    except Exception as e:
        logger.error(f"Error checking sales drop: {e}")
