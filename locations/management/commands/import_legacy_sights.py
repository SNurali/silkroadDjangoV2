import os
from django.core.management.base import BaseCommand
from django.db import connection, transaction
from locations.models import Sight, Region, District

class Command(BaseCommand):
    help = 'Import legacy sights from SQL dump'

    def handle(self, *args, **options):
        # 1. Create Temp Table
        create_sql = """
        CREATE TABLE IF NOT EXISTS `tb_sights_temp` (
          `id` integer PRIMARY KEY,
          `id_vendor` int DEFAULT NULL,
          `category_id` int DEFAULT NULL,
          `name` varchar(255) DEFAULT NULL,
          `region_id` int NOT NULL,
          `district_id` int NOT NULL,
          `address` varchar(255) NOT NULL,
          `geolocation` varchar(255) DEFAULT NULL,
          `is_local` int NOT NULL DEFAULT '0',
          `is_foreg` int NOT NULL DEFAULT '0',
          `description` text,
          `sh_description` text,
          `status` varchar(50) DEFAULT 'active',
          `images` text,
          `created_dt` date DEFAULT NULL,
          `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
          `allow_from` time DEFAULT NULL,
          `allow_to` time DEFAULT NULL,
          `valid_days` int DEFAULT '30',
          `max_capacity` int DEFAULT NULL,
          `enable_tickets` int DEFAULT '0',
          `opening_times` json DEFAULT NULL,
          `created_by` int DEFAULT NULL,
          `is_active` int NOT NULL DEFAULT '1',
          `extra_services` json DEFAULT NULL,
          `required_conditions` json DEFAULT NULL,
          `policy` text,
          `rate` decimal(6,2) DEFAULT NULL,
          `buy_count` int DEFAULT '0',
          `cancelled_options` varchar(50) DEFAULT NULL,
          `deposit_turizm` decimal(15,2) DEFAULT '0.00'
        );
        """
        
        insert_file = 'sights_dump.sql'
        
        with transaction.atomic():
            with connection.cursor() as cursor:
                self.stdout.write("Creating temp table...")
                cursor.execute("DROP TABLE IF EXISTS `tb_sights_temp`")
                cursor.execute(create_sql)
                
                self.stdout.write("Reading dump file...")
                with open(insert_file, 'r') as f:
                    insert_sql = f.read()
                    
                # Fix MySQL specific syntax for SQLite
                insert_sql = insert_sql.replace('`tb_sights`', '`tb_sights_temp`')
                insert_sql = insert_sql.replace("\\'", "''") # Replace \' with ''
                insert_sql = insert_sql.replace('\\"', '"')   # Replace \" with "
                
                # Execute INSERTs
                # Split by INSERT INTO if multiple
                stmts = insert_sql.split('INSERT INTO')
                for stmt in stmts:
                    if not stmt.strip(): continue
                    full_stmt = 'INSERT INTO ' + stmt
                    try:
                        cursor.execute(full_stmt)
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f"Error inserting chunk: {e}"))
                        # Continue to try next chunks if any
                
                self.stdout.write("Migrating to Sight model...")
                cursor.execute("SELECT * FROM tb_sights_temp")
                rows = cursor.fetchall()
                # Get column names
                columns = [col[0] for col in cursor.description]
                
                for row in rows:
                    data = dict(zip(columns, row))
                    
                    # Map to Django Model
                    # Legacy: region_id, district_id
                    # We assume IDs in new DB match old DB or we skip if not found
                    try:
                        region = Region.objects.get(id=data['region_id'])
                    except Region.DoesNotExist:
                        self.stdout.write(self.style.WARNING(f"Region {data['region_id']} not found. Skipping {data['name']}"))
                        continue
                        
                    district = None
                    if data.get('district_id'):
                        district = District.objects.filter(id=data['district_id']).first()

                    # Handle description vs content
                    # sh_description seems to be English content in many rows? Or description (UZ)
                    # From dump: 'Ularning...' (UZ) in description col? 'Shah-i-Zinda...' (EN) in sh_description col?
                    # Dump values: 'Ularning...' (val 11), 'Shah-i-Zinda...' (val 12).
                    # Schema: description (11), sh_description (12).
                    
                    sight, created = Sight.objects.update_or_create(
                        name=data['name'],
                        defaults={
                            'region': region,
                            'district': district,
                            'address': data['address'],
                            'geolocation': data['geolocation'],
                            'price_local': data['is_local'], # Mapped from legacy column
                            'price_foreg': data['is_foreg'],
                            'description': data['description'], # UZ
                            'content': data['sh_description'],  # EN
                            'images': data['images'],
                            'is_active': True if data['status'] == 'active' else False
                        }
                    )
                    if created:
                        self.stdout.write(self.style.SUCCESS(f"Created: {sight.name}"))
                    else:
                        self.stdout.write(f"Updated: {sight.name}")

                cursor.execute("DROP TABLE IF EXISTS `tb_sights_temp`")
                self.stdout.write(self.style.SUCCESS("Done!"))
