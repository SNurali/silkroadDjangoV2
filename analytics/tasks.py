from celery import shared_task
from clickhouse_driver import Client
from django.conf import settings
from .alerts import check_cancellation_surge, check_sales_drop
from .scoring import update_vendor_performance_scores
import logging

logger = logging.getLogger(__name__)

@shared_task(queue='analytics_queue')
def sync_event_to_clickhouse_task(table_name, data):
    """
    Asynchronously inserts event data into ClickHouse.
    """
    try:
        client = Client(
            host=settings.CLICKHOUSE_HOST or 'localhost',
            port=settings.CLICKHOUSE_PORT or 9000,
            user=settings.CLICKHOUSE_USERNAME or 'default',
            password=settings.CLICKHOUSE_PASSWORD or '',
            database=settings.CLICKHOUSE_DATABASE or 'default'
        )
        
        columns = ', '.join(data.keys())
        placeholders = ', '.join(['%(' + k + ')s' for k in data.keys()])
        query = f"INSERT INTO {table_name} ({columns}) VALUES"
        
        client.execute(query, [data])
        # logger.info(f"Successfully synced event to {table_name}: {data.get('booking_id') or data.get('ticket_sale_id')}")
        
    except Exception as e:
        logger.error(f"Failed to sync event to ClickHouse ({table_name}): {e}")
        # Optionally retry or handle failure
        raise e

@shared_task(queue='analytics_queue')
def run_business_alerts_task():
    """
    Periodic task to run business anomaly detection.
    """
    logger.info("Running business alerts check...")
    check_cancellation_surge()
    check_sales_drop()

@shared_task(queue='analytics_queue')
def update_vendor_scores_task():
    """
    Periodic task to recalculate vendor performance scores.
    """
    logger.info("Updating vendor performance scores...")
    update_vendor_performance_scores()


