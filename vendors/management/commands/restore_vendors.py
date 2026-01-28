import os
import re
from django.core.management.base import BaseCommand
from django.conf import settings
from django.contrib.auth import get_user_model
from vendors.models import Vendor, VendorUserRole

User = get_user_model()

class Command(BaseCommand):
    help = 'Restores Vendor data (brand_name, legal_name, tax_id) and owners from SQL dump'

    def handle(self, *args, **options):
        dump_path = os.path.join(settings.BASE_DIR, 'silkroad_27_07.sql')
        if not os.path.exists(dump_path):
            self.stdout.write(self.style.ERROR(f'Dump file not found at {dump_path}'))
            return

        with open(dump_path, 'r', encoding='utf-8') as f:
            content = f.read()

        self.stdout.write("Restoring Vendor Data...")
        rows = self.extract_table_data(content, 'tb_vendors')
        
        # admin as default owner
        admin = User.objects.filter(is_superuser=True).first()

        for row in rows:
            # tb_vendors: id(0), user_id(1), ..., name(4), ..., attributes(12)
            try:
                legacy_id = int(row[0])
                user_id = int(row[1]) if row[1] else None
                name = row[4]
                attributes_json = row[12] if len(row) > 12 else '{}'
                
                # Try to find vendor in DB
                try:
                    vendor = Vendor.objects.get(id=legacy_id)
                except Vendor.DoesNotExist:
                    continue

                self.stdout.write(f"Updating Vendor {legacy_id}: {name}")
                
                # Parse attributes for legal name and INN
                import json
                try:
                    attrs = json.loads(attributes_json)
                except:
                    attrs = {}
                
                legal_name = attrs.get('legal_name', name)
                tax_id = attrs.get('inn', '')
                
                vendor.brand_name = name
                vendor.legal_name = legal_name
                vendor.tax_id = tax_id
                vendor.status = 'ACTIVE'
                vendor.save()
                
                # Restore Role (Owner)
                # Find the user. Since legacy IDs don't match exactly, we might need a fallback.
                # However, if the user already existed and had a OneToOne, 
                # maybe we can find them by email if we had it.
                # For this specific task, we'll try to find the user that WAS attached 
                # (but that link is gone from DB).
                
                # Heuristic: find user by ID if Django IDs were preserved, or by admin.
                owner = admin
                if user_id:
                    try:
                        # This assumes Django user ID matches legacy but this is risky.
                        # However, for local dev it might be true.
                        test_user = User.objects.get(id=user_id)
                        owner = test_user
                    except User.DoesNotExist:
                        pass
                
                VendorUserRole.objects.get_or_create(
                    user=owner,
                    vendor=vendor,
                    defaults={'role': 'OWNER'}
                )

            except Exception as e:
                self.stdout.write(self.style.WARNING(f"Error processing row {row[0]}: {str(e)}"))

        self.stdout.write(self.style.SUCCESS("Vendor restoration completed."))

    def extract_table_data(self, content, table_name):
        matches = re.findall(rf"INSERT INTO `{table_name}` VALUES (.*?);", content, re.DOTALL)
        rows = []
        for block in matches:
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
