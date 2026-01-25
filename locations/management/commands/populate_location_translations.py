from django.core.management.base import BaseCommand
from locations.models import Region

class Command(BaseCommand):
    help = 'Populate translations for Regions'

    def handle(self, *args, **kwargs):
        translations = {
            'ANDIJON': {'ru': 'Андижан', 'uz': 'Andijon'},
            'BUHORO': {'ru': 'Бухара', 'uz': 'Buxoro'},
            "FARG'ONA": {'ru': 'Фергана', 'uz': "Farg'ona"},
            'JIZZAX': {'ru': 'Джизак', 'uz': 'Jizzax'},
            'NAMANGAN': {'ru': 'Наманган', 'uz': 'Namangan'},
            'NAVOIY': {'ru': 'Навои', 'uz': 'Navoiy'},
            'QASHQADARYO': {'ru': 'Кашкадарья', 'uz': 'Qashqadaryo'},
            "QORAQALPOG'ISTON": {'ru': 'Каракалпакстан', 'uz': "Qoraqalpog'iston"},
            'SAMARQAND': {'ru': 'Самарканд', 'uz': 'Samarqand'},
            'SIRDARYO': {'ru': 'Сырдарья', 'uz': 'Sirdaryo'},
            'SURXONDARYO': {'ru': 'Сурхандарья', 'uz': 'Surxondaryo'},
            'TOSHKENT SHAHRI': {'ru': 'Ташкент', 'uz': 'Toshkent'},
            'TOSHKENT VILOYATI': {'ru': 'Ташкентская область', 'uz': 'Toshkent viloyati'},
            'XORAZM': {'ru': 'Хорезм', 'uz': 'Xorazm'},
        }

        # Normalize logic to match import data if needed
        # The DB currently has uppercase names like 'TOSHKENT', let's match vaguely
        
        all_regions = Region.objects.all()
        count = 0
        for r in all_regions:
            # Simple fuzzy match based on starting chars or known keys
            key = None
            name_upper = r.name.upper()
            
            # Direct match
            if name_upper in translations:
                key = name_upper
            # Partial match for Tashkent which might differ
            elif 'TASHKENT' in name_upper or 'TOSHKENT' in name_upper:
                if 'VILOYAT' in name_upper or 'REGION' in name_upper:
                    key = 'TOSHKENT VILOYATI'
                else:
                    key = 'TOSHKENT SHAHRI'
            elif 'SAMARQAND' in name_upper or 'SAMARKAND' in name_upper:
                key = 'SAMARQAND'
            elif 'BUKHARA' in name_upper or 'BUHORO' in name_upper:
                key = 'BUHORO'
            elif 'KHIVA' in name_upper or 'XORAZM' in name_upper:
                key = 'XORAZM'
            
            if key and key in translations:
                r.name_ru = translations[key]['ru']
                r.name_uz = translations[key]['uz']
                r.save()
                count += 1
                self.stdout.write(f"Updated {r.name}: {r.name_ru} / {r.name_uz}")

        self.stdout.write(self.style.SUCCESS(f'Successfully updated {count} regions'))
