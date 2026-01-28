from .schema import get_client
from hotels.models import Hotel
from django.db.models import Case, When
import logging

logger = logging.getLogger(__name__)

def get_trending_hotels(limit=10):
    """
    Returns hotel IDs that had the most bookings in the last 7 days.
    """
    client = get_client()
    query = '''
        SELECT booking_id, count() as sales
        FROM booking_events
        WHERE event_time >= now() - INTERVAL 7 DAY AND booking_type = 'hotel'
        GROUP BY booking_id
        ORDER BY sales DESC
        LIMIT 50
    '''
    try:
        results = client.execute(query)
        if not results:
            return Hotel.objects.none()
            
        hotel_ids = [row[0] for row in results]
        
        # Preserve order from ClickHouse
        preserved = Case(*[When(id=pk, then=pos) for pos, pk in enumerate(hotel_ids)])
        return Hotel.objects.filter(id__in=hotel_ids).order_by(preserved)[:limit]
        
    except Exception as e:
        logger.error(f"Error getting trending hotels: {e}")
        return Hotel.objects.none()

def get_popular_regions(limit=5):
    """
    Returns regions with highest volume.
    """
    client = get_client()
    query = "SELECT region, count() as c FROM booking_events GROUP BY region ORDER BY c DESC LIMIT %(limit)s"
    try:
        return client.execute(query, {'limit': limit})
    except:
        return []
