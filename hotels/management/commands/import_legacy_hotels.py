import os
import re
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.conf import settings
from hotels.models import Hotel
from locations.models import Region
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Imports Hotels from legacy SQL dump (tb_hotels)'

    def handle(self, *args, **options):
        # dump_path = os.path.join(settings.BASE_DIR, '../SilkRoadPHP/silkroad.local/silkroad_27_07.sql')
        # Use the file found by 'find' if above fails
        dump_path = os.path.join(settings.BASE_DIR, 'legacy_reference/silkroad_27_07.sql')
        
        if not os.path.exists(dump_path):
             dump_path = os.path.join(settings.BASE_DIR, '../SilkRoadPHP/silkroad.local/silkroad_27_07.sql')
        
        if not os.path.exists(dump_path):
            self.stdout.write(self.style.ERROR(f'Dump file not found at {dump_path}'))
            return

        admin_user = User.objects.filter(is_superuser=True).first()

        count = 0
        
        with open(dump_path, 'r', encoding='utf-8') as f:
            content = f.read()

        match = re.search(r"INSERT INTO `tb_hotels` VALUES (.*);", content, re.DOTALL)
        if not match:
            self.stdout.write(self.style.WARNING('No tb_hotels data found in dump.'))
            return

        values_block = match.group(1)
        # Split by `),(`
        chunks = values_block.split('),(')
        
        for idx, chunk in enumerate(chunks):
            if idx == 0 and chunk.startswith('('): chunk = chunk[1:]
            if idx == len(chunks) - 1 and chunk.endswith(')'): chunk = chunk[:-1]
                
            try:
                row = self.parse_sql_row(chunk)
                if row:
                    self.process_row(row, admin_user)
                    count += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error row {idx}: {e}'))

        self.stdout.write(self.style.SUCCESS(f'Successfully imported {count} Hotels'))

    def parse_sql_row(self, text):
        values = []
        current = []
        in_quote = False
        escape = False
        for char in text:
            if escape:
                current.append(char)
                escape = False
                continue
            if char == '\\':
                current.append(char)
                escape = True
                continue
            if char == "'" and not escape:
                in_quote = not in_quote
                current.append(char)
                continue
            if char == ',' and not in_quote:
                val = "".join(current).strip()
                values.append(self.clean_val(val))
                current = []
            else:
                current.append(char)
        if current:
            val = "".join(current).strip()
            values.append(self.clean_val(val))
        return values

    def clean_val(self, val):
        if val == 'NULL': return None
        if val.startswith("'") and val.endswith("'"):
            inner = val[1:-1]
            return inner.replace("\\'", "'").replace('\\\\', '\\')
        return val

    def process_row(self, row, admin_user):
        # Schema indices based on CREATE TABLE analysis:
        # 0: id, 1: id_region, ..., 6: name, 7: stars
        # 15: address, 18: phone
        # 21: image_path (text)
        # 33: description
        # 37: deposit, 39: price, 46: is_active
        
        try:
            name = row[6]
            stars = int(row[7]) if row[7] else 0
            address = row[15]
            phone = row[18]
            images = row[21]
            description = row[33]
            try:
                deposit = Decimal(row[37]) if row[37] else 0
            except: deposit = 0
            
            try: 
                 # price is index 39
                 price = Decimal(row[39]) if row[39] else 0
                 # NOTE: check index carefully. 
                 # Schema: ... 37: deposit, 38: deposit_turizm, 39: price
            except: price = 0
            
            is_active = True # Default to true or use row[46]
            
            # Region mapping
            region_name = 'Tashkent' # Default
            if 'Samarkand' in address: region_name = 'Samarkand'
            elif 'Bukhara' in address: region_name = 'Buchara'
            elif 'Khiva' in address: region_name = 'Khiva'
            
            # Fuzzy match region
            region = Region.objects.filter(name__icontains=region_name).first()
            if not region:
                 region = Region.objects.first()

            Hotel.objects.update_or_create(
                name=name,
                defaults={
                    'created_by': admin_user,
                    'region': region,
                    'address': address,
                    'stars': stars,
                    'description': description,
                    'deposit': deposit,
                    'price': price, # Using our calculated field
                    'images': images,
                    'is_active': is_active
                }
            )
        except Exception as e:
            print(f"Failed to process hotel {row[6] if len(row)>6 else '?'}: {e}")
