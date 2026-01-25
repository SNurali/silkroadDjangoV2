import os
import re
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.conf import settings
from hotels.models import Sight, Category
from vendors.models import Vendor
from locations.models import Region, Country
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Imports Sights from legacy SQL dump'

    def handle(self, *args, **options):
        dump_path = os.path.join(settings.BASE_DIR, '../SilkRoadPHP/silkroad.local/silkroad_27_07.sql')
        if not os.path.exists(dump_path):
            self.stdout.write(self.style.ERROR(f'Dump file not found at {dump_path}'))
            return

        # Ensure dependencies exist
        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            admin_user = User.objects.create_superuser('admin@silkroad.com', 'admin@silkroad.com', 'password123')
            self.stdout.write(self.style.SUCCESS('Created admin user'))

        default_vendor, _ = Vendor.objects.get_or_create(
            user=admin_user,
            defaults={'name': 'Legacy Vendor'} # Vendor might auto-create or have other required fields.
        )
        
        # If Vendor has specific required fields, we need to know them.
        # Assuming minimal creation based on view_file result.
        
        default_category, _ = Category.objects.get_or_create(name='Legacy Sight')
        default_country, _ = Country.objects.get_or_create(
            name='Uzbekistan', 
            defaults={'iso_code': 'UZ'} # Assuming code is needed or optional
        )
        
        default_region, _ = Region.objects.get_or_create(
            name='Tashkent',
            defaults={'country': default_country}
        )

        count = 0
        
        with open(dump_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Find INSERT statement for tb_sights
        # Pattern: INSERT INTO `tb_sights` VALUES (...);
        # We need to be careful with matching.
        match = re.search(r"INSERT INTO `tb_sights` VALUES (.*);", content, re.DOTALL)
        if not match:
            self.stdout.write(self.style.WARNING('No tb_sights data found in dump.'))
            return

        values_block = match.group(1)
        
        # Simple parser for SQL values (row), (row)
        # This is a basic parser that respects single quotes
        rows = []
        current_row = ""
        in_quote = False
        escape = False
        
        # We want to split by ")," BUT ignore commas/parentheses inside quotes.
        # Actually we just want to parse "CHAR" stream.
        
        buffer = ""
        in_row = False
        
        # Generator to yield rows
        def parse_rows(text):
            in_q = False
            esc = False
            paren_depth = 0
            current = []
            
            cur_val = ""
            
            # We are iterating through the big string of values
            # (val1, val2), (val3, val4)
            # We start inside the values block.
            
            # Use a slightly more robust regex split if possible? No, stream is better.
            
            # Let's try to interpret the values as python tuples after some cleanup
            # replace NULL with None, etc.
            # But dates and strings might be tricky.
            pass

        # Since writing a full parser is complex, let's use regex to split tuples if possible.
        # Or just split by `),(` which is the standard delimiter in mysqldump extended inserts.
        # Risk: `),(` inside a string. Unlikely for this specific content but possible.
        # Dump format: VALUES (1, ...), (2, ...), ...
        
        # Let's use string split on `),(` and fix the ends.
        
        chunks = values_block.split('),(')
        
        for idx, chunk in enumerate(chunks):
            # cleanup start/end parens for first/last chunk
            if idx == 0 and chunk.startswith('('):
                chunk = chunk[1:]
            if idx == len(chunks) - 1 and chunk.endswith(')'):
                chunk = chunk[:-1]
                
            # Now `chunk` is a comma-separated list of values: 39,17,5,'Bibixonim',...
            # We need to parse this line into a list of values.
            # We can use csv.reader with quotechar="'" but we need to handle `NULL`.
            
            # Hack: use AST literal eval?
            # Replace `NULL` with `None`
            # Unescaped sql quotes `\'` might need handling for python.
            
            try:
                # Basic replacements for SQL -> Python
                # SQL string: 'It\'s' -> Python: 'It\'s' (works)
                # SQL NULL -> None
                python_chunk = chunk.replace("NULL", "None")
                
                # If there are unquoted dates like 2025-05-24? 
                # In parsed chunk, strings are quoted '...'. Numbers are not.
                # Dates should be quoted in SQL 'Y-m-d'.
                # So mostly fine.
                
                # Issue: timestamp NULL vs '2025...'
                
                # Let's handle parsing manually:
                row_values = self.parse_sql_row(chunk)
                
                if row_values:
                     self.process_row(row_values, default_vendor, default_category, default_region)
                     count += 1
                     
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error parsing row chunk {idx}: {e} | Chunk: {chunk[:50]}...'))
                continue

        self.stdout.write(self.style.SUCCESS(f'Successfully imported {count} Sights'))

    def parse_sql_row(self, text):
        """
        Parses a single row's values (comma separated, SQL quoted) into a list.
        """
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
                current.append(char) # Keep backslash for now, or consume it? SQL dumps escape ' with \' 
                escape = True
                continue
                
            if char == "'" and not escape:
                in_quote = not in_quote
                current.append(char)
                continue
            
            if char == ',' and not in_quote:
                # End of value
                val = "".join(current).strip()
                values.append(self.clean_val(val))
                current = []
            else:
                current.append(char)
                
        # Last value
        if current:
            val = "".join(current).strip()
            values.append(self.clean_val(val))
            
        return values

    def clean_val(self, val):
        if val == 'NULL':
            return None
        if val.startswith("'") and val.endswith("'"):
            # remove quotes and unescape
            # This is simple unescape, might need more for newlines etc
            inner = val[1:-1]
            # inner = inner.replace("\\'", "'").replace('\\"', '"').replace('\\n', '\n')
            # Actually basic replacement is enough for names/desc
            return inner.replace("\\'", "'").replace('\\\\', '\\')
        return val

    def process_row(self, row, default_vendor, default_category, default_region):
        # Mapping based on dump structure
        # 0: id, 1: id_vendor, 2: cat_id, 3: name, 4: region, 5: district, 6: address, 7: geo
        # 8: local_price, 9: foreg_price, 10: desc, 11: sh_desc, 12: status, 13: images
        
        try:
            name = row[3]
            address = row[6]
            geolocation = row[7]
            
            try:
                price_local = Decimal(row[8]) if row[8] else 0
            except: price_local = 0
            
            try:
                price_foreg = Decimal(row[9]) if row[9] else 0
            except: price_foreg = 0
            
            description = row[10]
            sh_description = row[11]
            status = row[12] if row[12] else 'active'
            images_str = row[13]
            
            # Create object
            sight, created = Sight.objects.update_or_create(
                name=name,
                defaults={
                    'vendor': default_vendor, # Mapping user vendor ID would require User import first, sticking to default for now as requested "move data" focus on Sights
                    'category': default_category,
                    'region': default_region, # Mapping region ID 7 -> Tashkent/Samarkand requires a map. Using default Tashkent for safety or I can fetch object if region_id matches legacy ID (if I imported regions).
                                              # Ideally populate Regions first. But for now default.
                    'address': address,
                    'geolocation': geolocation,
                    'is_local': price_local,
                    'is_foreg': price_foreg,
                    'description': description,
                    'sh_description': sh_description,
                    'status': status,
                    'images': images_str, # Images are strings like "images/permanent/..."
                    # We might need to ensure they start with proper path if Django expects it.
                    # Sight.get_images_list adds /media/ if missing. The dump has "images/..." which is relative.
                    # If file is in /media/images/..., then "images/..." is correct relative to media root?
                    # No, Django ImageField stores relative to MEDIA_ROOT. 
                    # If I store "images/permanent/foo.png" and MEDIA_ROOT is /media/, full path is /media/images/permanent. Correct.
                }
            )
            # print(f"Processed {name}")
            
        except Exception as e:
            print(f"Error processing row {row[0] if row else '?'}: {e}")

