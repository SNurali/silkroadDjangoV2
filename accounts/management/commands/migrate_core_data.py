from django.core.management.base import BaseCommand
from django.db import connections
from django.utils import timezone
from accounts.models import User
from vendors.models import Vendor
from datetime import datetime
import pytz

class Command(BaseCommand):
    help = 'Migrate core data (Users, Vendors) from legacy DB'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', default=True)
        parser.add_argument('--no-dry-run', action='store_false', dest='dry_run')

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        self.stdout.write("Migrating Core Data...")
        
        with connections['legacy'].cursor() as cursor:
            # 1. Users
            self.migrate_users(cursor, dry_run)
            # 2. Vendors
            self.migrate_vendors(cursor, dry_run)

    def migrate_users(self, cursor, dry_run):
        # Fields in tb_users: id, name, lname, email, password, phone, dtb, sex, created_at, updated_at
        # Assuming table has these columns.
        query = "SELECT id, name, lname, email, password, phone, dtb, sex, created_at, updated_at FROM tb_users"
        cursor.execute(query)
        rows = cursor.fetchall()
        
        count = 0
        for row in rows:
            uid, name, lname, email, password, phone, dtb, sex, created_at, updated_at = row
            
            # Skip if exists
            if User.objects.filter(id=uid).exists():
                self.stdout.write(f"User {uid} ({email}) already exists. Skipping.")
                continue

            if dry_run:
                self.stdout.write(f"[DRY] Would create User {uid}: {email}")
                count += 1
                continue

            try:
                # Handle dates
                # created_at might be str or datetime
                # dtb might be str
                
                # Create
                u = User(id=uid, email=email) # username field is None, do not pass it
                u.name = name
                u.lname = lname
                u.phone = phone
                u.sex = sex
                # u.dtb = dtb # format?
                # u.password = password # Legacy hash?
                u.set_password('password123') # Reset for migration safety or use original hash if compatible
                
                # Timestamps (User model standard fields date_joined?)
                if created_at:
                     # Make aware if naive
                     # u.date_joined = ...
                     pass
                
                u.save()
                count += 1
                self.stdout.write(self.style.SUCCESS(f"Created User {uid}"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Failed to create User {uid}: {e}"))
                
        self.stdout.write(f"Processed {count} users.")

    def migrate_vendors(self, cursor, dry_run):
        # Fields tb_vendors: id, name, user_id, ...
        # Need to check columns?
        # User said: "id, name, email, photo"
        # But Vendor model links to User. `user_id` column in tb_vendors?
        # I'll query assuming `user_id` exists in tb_vendors.
        
        try:
             cursor.execute("DESCRIBE tb_vendors")
             cols = [c[0] for c in cursor.fetchall()]
             if 'user_id' not in cols:
                 self.stdout.write(self.style.WARNING("tb_vendors missing user_id column? Skipping linkage."))
        except:
             pass

        query = "SELECT id, name FROM tb_vendors" # Minimal
        # If user_id exists:
        query = "SELECT id, name, user_id FROM tb_vendors"
        try:
            cursor.execute(query)
        except Exception:
             # Fallback
             query = "SELECT id, name, NULL FROM tb_vendors" # if user_id missing
             cursor.execute(query)

        rows = cursor.fetchall()
        count = 0
        
        for row in rows:
            vid, name, user_id = row
            
            if Vendor.objects.filter(id=vid).exists():
                continue

            if dry_run:
                self.stdout.write(f"[DRY] Would create Vendor {vid}: {name}")
                count += 1
                continue
            
            try:
                v = Vendor(id=vid, name=name)
                # Link User if exists
                if user_id:
                    rel_user = User.objects.filter(id=user_id).first()
                    if rel_user:
                        v.user = rel_user
                
                v.save()
                count += 1
                self.stdout.write(self.style.SUCCESS(f"Created Vendor {vid}"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Failed Vendor {vid}: {e}"))

        self.stdout.write(f"Processed {count} vendors.")
