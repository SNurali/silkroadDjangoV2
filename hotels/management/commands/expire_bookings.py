from django.core.management.base import BaseCommand
from django.utils import timezone
from hotels.models import Ticket
from notifications.models import Notification

class Command(BaseCommand):
    help = 'Expires pending tickets passed their creation deadline'

    def handle(self, *args, **options):
        now = timezone.now()
        # Find pending tickets where deadline < now
        expired_tickets = Ticket.objects.filter(
            booking_status='pending',
            confirmation_deadline__lt=now
        )
        
        count = expired_tickets.count()
        
        for ticket in expired_tickets:
            ticket.booking_status = 'expired'
            ticket.is_valid = False
            ticket.save()
            
            # Notify User
            if ticket.created_by:
                Notification.objects.create(
                    user=ticket.created_by,
                    title="Tour Request Expired",
                    message=f"Your tour request for '{ticket.sight.name}' expired because the vendor did not confirm it in time.",
                    type="warning",
                    link="/profile/bookings"
                )
                
            # Notify Vendor (Optional but good)
            # Assuming Vendor is a user attached to Vendor Profile attached to Sight
            # vendor_user = ticket.vendor.user ... logic might vary
        
        self.stdout.write(self.style.SUCCESS(f'Successfully expired {count} tickets'))
