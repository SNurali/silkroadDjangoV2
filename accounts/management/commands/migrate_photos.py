from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.db import connections
import shutil
from datetime import datetime
from pathlib import Path
from accounts.models import User, UserImage
from vendors.models import Vendor, VendorImage
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Migrate photos from legacy PHP MySQL to Django media'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', default=True,
                            help='Show what would be done without actually copying or saving')
        parser.add_argument('--no-dry-run', action='store_false', dest='dry_run',
                            help='Actually execute the migration')
        parser.add_argument('--php-public-root', type=str, default='/home/mrnurali/PycharmProjects/SilkRoad/SilkRoadPHP/silkroad.local/public',
                            help='Root path to PHP public directory')
        parser.add_argument('--php-storage-root', type=str, default='/home/mrnurali/PycharmProjects/SilkRoad/SilkRoadPHP/silkroad.local/storage/app/public',
                            help='Root path to PHP storage/app/public directory')
        parser.add_argument('--user-id', type=int, help='Migrate only this user')
        parser.add_argument('--vendor-id', type=int, help='Migrate only this vendor')

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        php_public_root = Path(options['php_public_root'])
        php_storage_root = Path(options['php_storage_root'])
        using_db = 'legacy'

        if using_db not in connections:
            self.stdout.write(self.style.ERROR(f"Database '{using_db}' not configured in settings.DATABASES"))
            return

        self.stdout.write(f"Connecting to database '{using_db}'...")
        try:
            with connections[using_db].cursor() as cursor:
                # Users
                self._process_entity(cursor, 'user', options, php_public_root, php_storage_root, dry_run)
                # Vendors
                self._process_entity(cursor, 'vendor', options, php_public_root, php_storage_root, dry_run)
                    
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Database connection or query failed: {e}"))

    def _process_entity(self, cursor, entity_type, options, php_public, php_storage, dry_run):
        table = 'tb_users' if entity_type == 'user' else 'tb_vendors'
        
        # Try to select created_at
        query = f"SELECT id, photo, created_at FROM {table} WHERE photo IS NOT NULL AND photo != ''"
        
        option_id = options.get(f'{entity_type}_id')
        if option_id:
            query += f" AND id = {option_id}"
            
        self.stdout.write(f"Checking {table}...")
        try:
            cursor.execute(query)
            rows = cursor.fetchall()
        except Exception as e:
             self.stdout.write(self.style.WARNING(f"Query with created_at failed ({e}), trying without..."))
             query = f"SELECT id, photo FROM {table} WHERE photo IS NOT NULL AND photo != ''"
             if option_id:
                query += f" AND id = {option_id}"
             cursor.execute(query)
             rows = cursor.fetchall()
             # Pad rows with None for created_at
             rows = [(r[0], r[1], None) for r in rows]

        self.stdout.write(f"Found {len(rows)} {entity_type}s with photos.")

        for row in rows:
            entity_id = row[0]
            old_path = row[1]
            created_at = row[2] if len(row) > 2 else None
            
            self._migrate_photo(entity_id, old_path, created_at, entity_type, php_public, php_storage, dry_run)

    def _migrate_photo(self, entity_id, old_rel_path, created_at, entity_type, php_public, php_storage, dry_run):
        # 1. Determine Source File
        
        # Cleaning logic from user request
        # Remove possible prefixes to get pure filename or relative path
        clean_path = old_rel_path.strip('/')
        
        # Fixing logic to be safe (avoid lstrip set issue):
        if clean_path.startswith('assets/images/vendors/'):
            clean_path = clean_path[len('assets/images/vendors/'):]
        if clean_path.startswith('assets/images/users/'):
            clean_path = clean_path[len('assets/images/users/'):]
        if clean_path.startswith('uploads/'):
            clean_path = clean_path[len('uploads/'):]
            
        clean_path = clean_path.strip('/')

        candidates = [
            # User path discovered (avatars!)
            php_storage / 'avatars' / clean_path,
            php_public / 'storage/avatars' / clean_path,
            php_storage / 'uploads/gallery' / clean_path, # keep just in case
            
            php_public / 'assets/images/users' / clean_path,
            php_public / 'assets/images/vendors' / clean_path,
            php_public / 'uploads' / clean_path,
            php_public / 'images' / clean_path,
            php_public / clean_path,
            php_storage / clean_path, 
        ]
        
        found_path = None
        for p in candidates:
             if p.exists():
                 found_path = p
                 break
        
        if not found_path:
            self.stdout.write(self.style.WARNING(f"File not found for {entity_type} {entity_id} ({old_rel_path}) cleaned={clean_path}. Checked {len(candidates)} paths."))
            return

        # 2. Determine Destination
        new_filename = found_path.name
        
        # Use uploaded_at timestamp or now
        if isinstance(created_at, str):
            try:
                ts = datetime.fromisoformat(str(created_at))
            except:
                ts = datetime.now()
        elif isinstance(created_at, datetime):
            ts = created_at
        else:
            ts = datetime.now()
            
        subfolder = 'user_photos' if entity_type == 'user' else 'vendor_photos'
        new_rel_dir = f"{subfolder}/{ts:%Y/%m/%d}"
        new_rel_path = f"{new_rel_dir}/{new_filename}"
        new_full_path = Path(settings.MEDIA_ROOT) / new_rel_path

        # 3. Dry Run Output
        if dry_run:
            self.stdout.write(f"[DRY-RUN] {entity_type} id={entity_id}, old path={old_rel_path} -> full: {found_path}")
            self.stdout.write(f"         Would copy to: {new_full_path}")
            self.stdout.write(f"         Would create {entity_type.capitalize()}Image(id={entity_id}, image={new_rel_path})")
            return

        # 4. Check Entity Existence
        if entity_type == 'user':
            entity_obj = User.objects.filter(id=entity_id).first()
        else:
            entity_obj = Vendor.objects.filter(id=entity_id).first()
            
        if not entity_obj:
            self.stdout.write(self.style.WARNING(f"Skipping: {entity_type} {entity_id} not found in Django DB"))
            return

        # 5. Execute Copy
        try:
             new_full_path.parent.mkdir(parents=True, exist_ok=True)
             if not new_full_path.exists():
                shutil.copy2(found_path, new_full_path)
                self.stdout.write(self.style.SUCCESS(f"Copied {found_path} -> {new_full_path}"))
             
             # 6. Save DB Record
             if entity_type == 'user':
                 UserImage.objects.create(
                    user=entity_obj,
                    image=new_rel_path,
                    order=0,
                    uploaded_at=ts
                 )
             else:
                 VendorImage.objects.create(
                    vendor=entity_obj,
                    image=new_rel_path,
                    order=0,
                    uploaded_at=ts
                 )
             self.stdout.write(self.style.SUCCESS(f"Created DB record for {entity_type} {entity_id}"))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error migrating {entity_type} {entity_id}: {e}"))
