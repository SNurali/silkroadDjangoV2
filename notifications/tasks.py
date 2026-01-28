from celery import shared_task
import logging

logger = logging.getLogger(__name__)

@shared_task
def send_notification_task(user_id, message):
    """
    Async task to send notifications (Email/Telegram).
    """
    logger.info(f"Sending notification to user {user_id}: {message}")
    # TODO: Implement real email sending
    return f"Notification sent to {user_id}"
