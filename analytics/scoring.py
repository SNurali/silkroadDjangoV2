from .schema import get_client
from vendors.models import Vendor
from django.db.models import Sum
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

def update_vendor_performance_scores():
    """
    Calculates performance score for all active vendors.
    Score = (Confirm Rate * 0.4) + (Volume Score * 0.3) + (Consistency * 0.3)
    """
    client = get_client()
    query = '''
        SELECT 
            vendor_id,
            sum(status = 'confirmed') as confirmed,
            sum(status = 'cancelled') as cancelled,
            count() as total,
            sum(amount) as revenue
        FROM booking_events
        WHERE event_time >= now() - INTERVAL 90 DAY
        GROUP BY vendor_id
    '''
    try:
        results = client.execute(query)
        stats_map = {row[0]: row[1:] for row in results}
        
        vendors = Vendor.objects.filter(is_active=True)
        for vendor in vendors:
            stats = stats_map.get(vendor.id)
            if not stats:
                continue
            
            confirmed, cancelled, total, revenue = stats
            
            # 1. Confirm Rate (0-100)
            confirm_rate = (confirmed / total * 100) if total > 0 else 0
            
            # 2. Revenue Score (relative to top earners) - simplified for now
            revenue_score = min(float(revenue) / 10000000 * 100, 100) # 10M UZS = 100 points
            
            # 3. Final Calculation
            score = (confirm_rate * 0.4) + (revenue_score * 0.6)
            
            vendor.performance_score = Decimal(str(round(score, 2)))
            vendor.save()
            
        # Update Ranks
        all_vendors = Vendor.objects.filter(is_active=True).order_by('-performance_score')
        for rank, v in enumerate(all_vendors, 1):
            v.rating_rank = rank
            v.save(update_fields=['rating_rank'])
            
    except Exception as e:
        logger.error(f"Error updating vendor scores: {e}")
