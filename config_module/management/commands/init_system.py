from django.core.management.base import BaseCommand
from config_module.models import SystemConfig, CurrencyRate
from decimal import Decimal

class Command(BaseCommand):
    help = 'Initialize system configuration and currency rates'

    def handle(self, *args, **options):
        # Initialize SystemConfig
        SystemConfig.objects.get_or_create(
            key='system_maintenance',
            defaults={
                'value': False,
                'description': 'Flag for system maintenance mode'
            }
        )
        
        # Initialize Currencies
        CurrencyRate.objects.get_or_create(
            code='UZS',
            defaults={'rate_to_uzs': Decimal('1.00')}
        )
        CurrencyRate.objects.get_or_create(
            code='USD',
            defaults={'rate_to_uzs': Decimal('12850.00')} # Example rate
        )
        
        self.stdout.write(self.style.SUCCESS('Successfully initialized system data'))
