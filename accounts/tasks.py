from celery import shared_task
import logging
from django.utils import timezone
from integrations.emehmon.client import EMehmonAPIClient
from accounts.models import ForeignProfileData, User

logger = logging.getLogger(__name__)

@shared_task
def sync_foreign_profile_task(user_id):
    """
    Syncs foreigner data (visa, registration) from E-mehmon.
    """
    try:
        user = User.objects.get(id=user_id)
        if not user.passport:
            logger.warning(f"User {user_id} has no passport number. Sync skipped.")
            return "Skipped: No passport"

        client = EMehmonAPIClient()
        logger.info(f"Syncing foreign status for {user.passport}")
        
        data = client.get_foreign_status(user.passport)
        
        # Update or Create ForeignProfileData
        ForeignProfileData.objects.update_or_create(
            user=user,
            defaults={
                "entry_date": data.get("entry_date"),
                "visa_expiry": data.get("visa_expiry"),
                "current_registration_place": data.get("address"), # Corrected field name
                "has_violations": data.get("violations", False),
                "last_sync_at": timezone.now()
            }
        )
        return "Success: Foreign profile synced"

    except Exception as e:
        logger.error(f"Error syncing foreign profile for user {user_id}: {e}")
        return f"Failed: {e}"
