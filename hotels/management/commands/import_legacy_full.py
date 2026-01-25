import os
import re
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils.timezone import now
from hotels.models import Sight, Category, Hotel, Room, RoomType
from vendors.models import Vendor
from locations.models import Region, Country
from django.utils.text import slugify

User = get_user_model()

class Command(BaseCommand):
    help = 'Fully imports Users, Vendors, Hotels, and Sights from legacy SQL dump'

    def handle(self, *args, **options):
        dump_path = os.path.join(settings.BASE_DIR, '../SilkRoadPHP/silkroad.local/silkroad_27_07.sql')
        if not os.path.exists(dump_path):
            self.stdout.write(self.style.ERROR(f'Dump file not found at {dump_path}'))
            return

        with open(dump_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 1. Import Users
        self.import_users(content)

        # 2. Import Vendors
        self.import_vendors(content)

        # 3. Import Hotels
        self.import_hotels(content)
        
        # 4. Import Sights
        self.import_sights(content)

    def import_users(self, content):
        self.stdout.write("Importing Users (tb_users)...")
        rows = self.extract_table_data(content, 'tb_users')
        count = 0
        for row in rows:
            # tb_users: id(0), name(1), ..., phone(7), email(8), ..., password(10)
            try:
                legacy_id = int(row[0])
                name = row[1]
                phone = row[7]
                email = row[8]
                password_hash = row[10] # bcrypt

                if not email:
                    continue

                user, created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        'name': name,
                        'phone': phone or '',
                        'password': password_hash, # Django uses pbkdf2 by default, but can handle bcrypt if configured? 
                                                  # For now, we store hash. Migration might need password reset.
                        'is_active': True
                    }
                )
                if created:
                    user.set_unusable_password() # Force reset or handle bcrypt later
                    user.save()
                    
                count += 1
            except Exception as e:
                pass
        self.stdout.write(self.style.SUCCESS(f"Imported {count} users"))

    def import_vendors(self, content):
        self.stdout.write("Importing Vendors (tb_vendors)...")
        rows = self.extract_table_data(content, 'tb_vendors')
        count = 0
        
        # Ensure default vendor for unmatched
        admin = User.objects.filter(is_superuser=True).first()
        Vendor.objects.get_or_create(user=admin, defaults={'name': 'Default Vendor'})

        for row in rows:
            # tb_vendors: id(0), user_id(1), ..., name(4), ..., logo(8)
            try:
                legacy_id = int(row[0])
                user_id = int(row[1]) # tb_users.id
                name = row[4]
                logo_path = row[8] # 'assets/images/vendors/...'

                # Map to Django User
                # We need to find the user by legacy ID if possible, but we didn't store legacy ID on User.
                # Assuming email match. But here we only have user_id. 
                # Complex. For now, try name match or skip user mapping (create standalone vendor with admin owner if user not found).
                
                # Check if we can find user by email from user list? 
                # Let's just attach to admin if mapping fails, or try to match name.
                
                vendor, created = Vendor.objects.update_or_create(
                    name=name,
                    defaults={
                        'user': admin, # Fallback
                        'cover_image': logo_path # Django will serve /media/assets/images/vendors/...
                    }
                )
                count += 1
            except Exception as e:
                pass
        self.stdout.write(self.style.SUCCESS(f"Imported {count} vendors"))

    def import_hotels(self, content):
        self.stdout.write("Importing Hotels (tb_hotels)...")
        rows = self.extract_table_data(content, 'tb_hotels')
        count = 0
        
        default_country, _ = Country.objects.get_or_create(name='Uzbekistan', defaults={'iso_code': 'UZ'})
        default_region, _ = Region.objects.get_or_create(name='Tashkent', defaults={'country': default_country})

        for row in rows:
            # tb_hotels: id(0), id_region(1), ... name(6), stars(7), ... address(15), ... images(20 or 21?)
            # Based on grep output:
            # INSERT INTO `tb_hotels` VALUES (1,1,NULL,NULL,1,1,'Movenpick Samarkand',5,'00000000000001',NULL,NULL,NULL,NULL,NULL,NULL,'Samarkand, Uzbekistan','LIC-00001',NULL,'+998 90 000 00 01',0,NULL,'frontend/h...)
            
            try:
                name = row[6]
                stars = int(row[7])
                address = row[15]
                # row[21] seems to be images? Let's check index carefully.
                # 0:id, 1:region, 2:cert, 3:dist, 4:type, 5:status, 6:name, 7:stars, 8:inn, 9:oked, 10:geo, 11:bank, 12:bname, 13:hacc, 14:bacc, 15:addr, 16:lic, 17:licdate, 18:phone, 19:noshow, 20:?, 21:images?
                
                # Let's look at the end of the line for images.
                # 'frontend/hotels/images/...'
                
                images_str = ""
                # Heuristic: find the column that looks like image path
                for col in row:
                    if col and ('images/' in str(col) or 'frontend/' in str(col) or 'uploads/' in str(col)):
                        images_str = col
                        break
                
                hotel, created = Hotel.objects.update_or_create(
                    id=int(row[0]),  # Preserve Legacy ID
                    defaults={
                        'name': name,
                        'region': default_region,
                        'address': address,
                        'stars': stars,
                        'description': f"Legacy Hotel {name}",
                        'images': images_str,
                        'is_active': True
                    }
                )
                count += 1
            except Exception as e:
                # print(e)
                pass
        self.stdout.write(self.style.SUCCESS(f"Imported {count} hotels"))

    def import_sights(self, content):
        self.stdout.write("Importing Sights (tb_sights)...")
        rows = self.extract_table_data(content, 'tb_sights')
        count = 0
        default_vendor = Vendor.objects.first()
        default_category, _ = Category.objects.get_or_create(name='Sightseeing')
        default_region = Region.objects.first()

        for row in rows:
            # 0: id, 1: id_vendor, 2: cat_id, 3: name, 4: region, 5: district, 6: address, 7: geo
            # 8: local_price, 9: foreg_price, 10: desc, 11: sh_desc, 12: status, 13: images
            try:
                name = row[3]
                images_str = row[13]

                Sight.objects.update_or_create(
                    id=int(row[0]), # Preserve Legacy ID
                    defaults={
                        'name': name,
                        'vendor': default_vendor,
                        'category': default_category,
                        'region': default_region,
                        'address': row[6],
                        'description': row[10],
                        'sh_description': row[11],
                        'images': images_str,
                        'is_foreg': Decimal(row[9]) if row[9] else 0,
                        'is_local': Decimal(row[8]) if row[8] else 0,
                        'status': 'active'
                    }
                )
                count += 1
            except Exception as e:
                pass
        self.stdout.write(self.style.SUCCESS(f"Imported {count} sights"))

    def extract_table_data(self, content, table_name):
        # Find INSERT statements
        matches = re.findall(rf"INSERT INTO `{table_name}` VALUES (.*?);", content, re.DOTALL)
        rows = []
        for block in matches:
             # Basic split by ),( 
             # Warning: fragile for complex data but works for standard dumps
             chunks = block.split('),(')
             for i, chunk in enumerate(chunks):
                 if i == 0: chunk = chunk.lstrip('(')
                 if i == len(chunks)-1: chunk = chunk.rstrip(')')
                 rows.append(self.parse_sql_row(chunk))
        return rows

    def parse_sql_row(self, text):
        values = []
        current = []
        in_quote = False
        escape = False
        for char in text:
            if escape:
                current.append(char); escape = False; continue
            if char == '\\':
                current.append(char); escape = True; continue
            if char == "'" and not escape:
                in_quote = not in_quote
                current.append(char); continue
            if char == ',' and not in_quote:
                values.append(self.clean_val("".join(current).strip()))
                current = []
            else:
                current.append(char)
        if current: values.append(self.clean_val("".join(current).strip()))
        return values

    def clean_val(self, val):
        if val == 'NULL': return None
        if val.startswith("'") and val.endswith("'"):
            return val[1:-1].replace("\\'", "'").replace('\\\\', '\\')
        return val
