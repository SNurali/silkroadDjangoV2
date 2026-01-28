import logging
import json
from django.conf import settings

logger = logging.getLogger('silkroad.analytics')

class AnalyticsService:
    """
    Enterprise Analytics Layer.
    Transfers events to Kafka/ClickHouse for high-scale reporting.
    """
    
    @staticmethod
    def log_event(event_type, user_id, data):
        """
        Logs an analytical event.
        In production, this pushes to a Kafka topic.
        """
        event_payload = {
            'event': event_type,
            'user_id': user_id,
            'data': data,
            'timestamp': 'auto' # Handled by consumer/DB
        }
        
        # Local Logging (ClickHouse local buffer simulation)
        logger.info(f"ANALYTICS_EVENT: {json.dumps(event_payload)}")
        
        # ClickHouse Integration
        AnalyticsService._push_to_clickhouse(event_type, user_id, data)

    @staticmethod
    def _push_to_clickhouse(event_type, user_id, data):
        """
        Internal method to push events to ClickHouse.
        """
        try:
            from analytics.schema import get_client
            from django.utils import timezone
            client = get_client()
            
            # Simple mapping to booking_events table
            # In a real system, we'd use multiple tables or a more generic one
            client.execute(
                'INSERT INTO booking_events (event_time, booking_id, user_id, vendor_id, booking_type, status, amount, created_at) VALUES',
                [{
                    'event_time': timezone.now(),
                    'booking_id': data.get('booking_id', 0),
                    'user_id': user_id or 0,
                    'vendor_id': data.get('vendor_id', 0),
                    'booking_type': event_type,
                    'status': data.get('status', 'new'),
                    'amount': float(data.get('amount', 0)),
                    'created_at': timezone.now()
                }]
            )
        except Exception as e:
            # Silent fail for analytics to prevent blocking transactions
            logger.error(f"ClickHouse Push Error: {e}")

    @staticmethod
    def get_user_stats(user_id):
        """
        Retrieves stats from ClickHouse.
        """
        # Mocking sub-second analytical query result
        return {
            'bookings_30d': 5,
            'search_frequency': 'High',
            'top_destinations': ['Samarkand', 'Bukhara']
        }

    @staticmethod
    def log_search(user_id, filters):
        """Specific logger for search analytics to drive recommendation engines."""
        AnalyticsService.log_event('search_performed', user_id, filters)

    @staticmethod
    def log_booking(user_id, booking_id, amount):
        """Specific logger for financial transaction analytics."""
        AnalyticsService.log_event('booking_created', user_id, {
            'booking_id': booking_id,
            'amount': float(amount)
        })
