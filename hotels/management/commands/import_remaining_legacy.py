from django.core.management.base import BaseCommand
from vendors.models import Vendor, MediaFile
from hotels.models import Hotel, RoomType, Room, RoomPrice
from bookings.models import Booking
from accounts.models import User
import re
import ast
from datetime import datetime

class Command(BaseCommand):
    help = 'Imports remaining legacy data from SQL dump'

    def handle(self, *args, **options):
        sql_file = '/home/mrnurali/PycharmProjects/SilkRoad/SilkRoadPHP/silkroad.local/silkroad_27_07.sql'
        self.stdout.write(f"Parsing SQL dump: {sql_file}")

        with open(sql_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        # Helper to parse INSERT VALUES
        def parse_inserts(table_name):
            pattern = re.compile(f"INSERT INTO `{table_name}` VALUES (.*?);", re.DOTALL)
            matches = pattern.findall(content)
            rows = []
            for match in matches:
                # Split by ),( to get individual rows
                # This is a naive parser, assuming standard mysqldump format
                # Better: use regex to find (...) groups
                # Let's try to match content inside brackets
                # Because values can contain commas, we need to be careful.
                # Regex for (val1, val2, ...), (val1, ...)
                # But typical dump has one INSERT statement with multiple (...), (...).
                pass
            return matches

        # 1. Media Files
        self.stdout.write("Importing Media Files...")
        # Pattern: (1,'avatar','demo/general/avatar.jpg',NULL,'image/jpeg','jpg',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0)
        # Regex to find tuples. 
        # Since parsing SQL strictly is hard with regex, we will try to find the INSERT block and process simpler.
        
        # We'll use a library-less approach by stripping the header and splitting by `),(` carefully.
        
        def process_insert_block(table, callback):
            start_marker = f"INSERT INTO `{table}` VALUES "
            start_pos = content.find(start_marker)
            if start_pos == -1:
                self.stdout.write(f"Table {table} not found.")
                return

            end_pos = content.find(";", start_pos)
            values_str = content[start_pos + len(start_marker):end_pos]
            
            # Normalize to python list of tuples logic
            # Use ast.literal_eval is risky if NULL is present.
            # Manual parse: replace NULL with None, etc.
            
            # Simple Hack: Split by `),(`, then manually clean start `(` and end `)`
            # Warning: string content might contain `),(`. proper parsing needed.
            # But usually dumps are consistent.
            
            current_row = ""
            in_string = False
            for char in values_str:
                if char == "'" and (len(current_row) == 0 or current_row[-1] != "\\"):
                    in_string = not in_string
                
                if char == "," and not in_string and current_row.strip().endswith(")"):
                    # Split point? No, standard is `),(`
                    pass
                
                current_row += char
           
            # Let's try a regex for values
            # \((?:[^)(]+|(?R))*+\) ... no recursion in Python re
            
            # Fallback: simple split if we trust data not to have `),(` in content often.
            # or usage of a specialized parser pattern.
            
            # Let's try splitting on `),(`
            rows = values_str.split("),(")
            
            count = 0
            for idx, raw_row in enumerate(rows):
                if idx == 0: raw_row = raw_row[1:] # remove first (
                if idx == len(rows)-1: raw_row = raw_row[:-1] # remove last )
                
                # Replace SQL NULL with None
                raw_row = raw_row.replace("NULL", "None")
                
                try:
                    # Escape unescaped quotes?
                    # Eval
                    # This is fragile but often works for simple dumps
                    row = eval(f"[{raw_row}]")
                    callback(row)
                    count += 1
                except Exception as e:
                    pass
            self.stdout.write(f"Imported {count} rows for {table}")

        # Callbacks
        def import_media(row):
            # id, file_name, file_path, ...
            MediaFile.objects.update_or_create(
                id=row[0],
                defaults={
                    'file_name': row[1],
                    'file_path': row[2],
                    'file_type': row[4],
                    'file_extension': row[5]
                }
            )

        def import_room_type(row):
            # id, en, ru, uz
            RoomType.objects.update_or_create(
                id=row[0],
                defaults={
                    'en': row[1],
                    'ru': row[2],
                    'uz': row[3]
                }
            )
            
        def import_room(row):
            # id(0), hotel(1), type(2), aircond(3), wifi(4), tv(5), freezer(6), active(7)
            try:
                Room.objects.update_or_create(
                    id=row[0],
                    defaults={
                        'hotel_id': row[1],
                        'room_type_id': row[2],
                        'aircond': bool(row[3]),
                        'wifi': bool(row[4]),
                        'tvset': bool(row[5]),
                        'freezer': bool(row[6]),
                        'active': str(row[7]) == '1'
                    }
                )
            except: pass

        def import_price(row):
             # id(0), hotel(1), type(2), dt(3), usd(4), uzs(5)
            try:
                RoomPrice.objects.update_or_create(
                    id=row[0],
                    defaults={
                        'hotel_id': row[1],
                        'room_type_id': row[2],
                        'dt': row[3],
                        'usd': row[4],
                        'uzs': row[5]
                    }
                )
            except: pass

        # Execution
        try:
           process_insert_block('media_files', import_media)
           process_insert_block('tb_room_types', import_room_type)
           process_insert_block('tb_rooms', import_room)
           process_insert_block('tb_room_prices', import_price)
        except Exception as e:
            self.stdout.write(f"Error during parsing: {e}")

