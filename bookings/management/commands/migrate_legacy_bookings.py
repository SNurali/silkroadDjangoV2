from django.core.management.base import BaseCommand
from django.db import transaction
from hotels.models import Booking as LegacyBooking
from bookings.models import Booking as NewBooking, BookingStatusHistory
# Use string references or direct imports for RoomType/Hotel if needed, 
# but models are ForeignKeys so we can copy the ID reference directly or fetch object.
from hotels.models import Hotel, RoomType
from accounts.models import User
from config_module.models import CurrencyRate

class Command(BaseCommand):
    help = 'Migrates data from legacy hotels.Booking to bookings.Booking'

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting migration of legacy bookings...")
        
        legacy_bookings = LegacyBooking.objects.all()
        count = legacy_bookings.count()
        self.stdout.write(f"Found {count} legacy bookings.")

        if count == 0:
            self.stdout.write(self.style.SUCCESS("No legacy bookings to migrate."))
            return

        migrated_count = 0
        skipped_count = 0

        # Ensure default currency exists
        default_currency, _ = CurrencyRate.objects.get_or_create(code='UZS', defaults={'rate': 1})

        with transaction.atomic():
            for lb in legacy_bookings:
                try:
                    # Map Status
                    status_map = {
                        'pending': 'NEW',
                        'confirmed': 'CONFIRMED',
                        'cancelled': 'CANCELLED',
                        'completed': 'COMPLETED',
                        'rejected': 'REJECTED'
                    }
                    new_status = status_map.get(lb.booking_status, 'NEW')

                    # Parse JSON for room type logic if needed, or default to null
                    # Legacy 'selected_rooms_json' format varies, simplified to single room type for migration
                    # or skip room type if complex. 
                    # Assuming we just migrate the main record.
                    
                    # Create New Booking
                    nb = NewBooking.objects.create(
                        user=lb.user if lb.user else User.objects.first(), # Fallback if user null (shouldn't be in legacy but just in case)
                        hotel=lb.hotel,
                        check_in=lb.check_in,
                        check_out=lb.check_out,
                        adults=lb.adults,
                        children=lb.children,
                        status=new_status,
                        total_price=lb.total_price,
                        currency=default_currency, 
                        # emehmon_id - leave blank or map if legacy had it (legacy model didn't seem to have explicit emehmon_id for booking, only Hotel/RoomType)
                    )
                    
                    # Override created_at to preserve history
                    nb.created_at = lb.created_at
                    nb.save()

                    # Create History Record
                    BookingStatusHistory.objects.create(
                        booking=nb,
                        status=new_status,
                        comment=f"Migrated from Legacy Booking #{lb.id}",
                        timestamp=lb.created_at
                    )
                    
                    migrated_count += 1
                    
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Failed to migrate LegacyBooking #{lb.id}: {e}"))
                    skipped_count += 1

        self.stdout.write(self.style.SUCCESS(f"Migration complete. Migrated: {migrated_count}, Skipped: {skipped_count}"))
