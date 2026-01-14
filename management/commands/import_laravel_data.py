import re
from pathlib import Path
from datetime import datetime
from decimal import Decimal, InvalidOperation
import json
import sys
import os
import django
import argparse

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction, connection
from django.contrib.auth.hashers import make_password


class Command(BaseCommand):
    """
    Импорт данных из SQL-дампа Laravel в Django-модели.
    Поддерживает tb_users, tb_vendors, tb_categories, tb_sights, tb_tickets.
    """
    help = 'Импорт данных из Laravel SQL-дампа'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            default='C:/OSPanel/home/silkroad.local/silkroad_27_07.sql',
            help='Полный путь к файлу дампа (например C:/OSPanel/home/silkroad.local/silkroad_27_07.sql)'
        )

    def handle(self, *args, **options):
        # Импорты перемещены сюда, чтобы избежать ошибок на этапе загрузки модуля
        from django.utils import timezone
        from accounts.models import User
        from vendors.models import Vendor
        from hotels.models import Category, Sight, Ticket
        from locations.models import Country, Region, District

        file_path = Path(options['file']).resolve()
        if not file_path.is_file():
            raise CommandError(f"Файл не найден: {file_path}")

        self.stdout.write(self.style.NOTICE(f"Начинаем импорт из: {file_path}"))

        with transaction.atomic():
            self.stdout.write("Очищаем бизнес-таблицы...")
            self.clear_tables()

            self.stdout.write("Импорт пользователей...")
            self.import_users(file_path)

            self.stdout.write("Импорт категорий...")
            self.import_categories(file_path)

            self.stdout.write("Импорт вендоров...")
            self.import_vendors(file_path)

            self.stdout.write("Импорт достопримечательностей...")
            self.import_sights(file_path)

            self.stdout.write("Импорт билетов...")
            self.import_tickets(file_path)

        self.stdout.write(self.style.SUCCESS("Импорт завершён успешно!"))
        self.stdout.write("Проверьте данные:")
        self.stdout.write("  python manage.py shell")
        self.stdout.write("  >>> from accounts.models import User")
        self.stdout.write("  >>> User.objects.count()")
        self.stdout.write("  >>> from hotels.models import Sight")
        self.stdout.write("  >>> Sight.objects.filter(status='active').count()")
        self.stdout.write("Для входа в админку сбросьте пароль админа:")
        self.stdout.write("  >>> u = User.objects.filter(email='admin@mail.ru').first()")
        self.stdout.write("  >>> u.set_password('admin2026')")
        self.stdout.write("  >>> u.save()")

    def clear_tables(self):
        """Очищаем только бизнес-таблицы, не трогаем системные Django-таблицы"""
        tables = [
            'tb_users', 'tb_vendors', 'tb_categories',
            'tb_sights', 'tb_sight_facilities', 'tb_tickets',
            'tb_transactions', 'tb_transactions_deleted',
        ]
        with connection.cursor() as cursor:
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
            for table in tables:
                cursor.execute(f"TRUNCATE TABLE `{table}`;")
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
        self.stdout.write("Таблицы очищены")

    def parse_inserts(self, file_path: Path, table_name: str) -> list:
        """Извлекает все INSERT-запросы для указанной таблицы"""
        inserts = []
        current = ""
        in_insert = False

        with file_path.open('r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                line = line.strip()
                if line.startswith(f"INSERT INTO `{table_name}`"):
                    in_insert = True
                    current = line
                elif in_insert:
                    current += " " + line
                    if line.endswith(';'):
                        inserts.append(current.strip())
                        in_insert = False
                        current = ""

        return inserts

    def parse_row_values(self, insert_stmt: str) -> list:
        """Парсит VALUES (...) из INSERT с улучшенной обработкой экранирования"""
        match = re.search(r'VALUES\s*(.+?);$', insert_stmt, re.DOTALL | re.IGNORECASE)
        if not match:
            return []

        values_str = match.group(1).strip()
        # Улучшенный разбор рядов с учётом вложенных скобок
        rows = []
        current_row = ""
        depth = 0
        for char in values_str:
            if char == '(' and depth == 0:
                depth += 1
            elif char == '(':
                depth += 1
                current_row += char
            elif char == ')' and depth == 1:
                depth -= 1
                rows.append(current_row.strip())
                current_row = ""
            elif char == ')':
                depth -= 1
                current_row += char
            elif depth > 0:
                current_row += char
            # Игнорируем запятые вне рядов

        parsed_rows = []
        for row_str in rows:
            values = []
            current = ""
            in_quotes = False
            escaped = False
            i = 0
            while i < len(row_str):
                char = row_str[i]
                if escaped:
                    current += char
                    escaped = False
                    i += 1
                    continue
                if char == '\\':
                    escaped = True
                    i += 1
                    continue
                if char == "'" and not in_quotes:
                    in_quotes = True
                    current += char
                elif char == "'" and in_quotes:
                    in_quotes = False
                    current += char
                elif char == ',' and not in_quotes:
                    if current:
                        values.append(current.strip())
                    current = ""
                else:
                    current += char
                i += 1
            if current:
                values.append(current.strip())

            # Очистка и приведение типов с fallback
            cleaned = []
            for v in values:
                v = v.strip()
                if v == 'NULL':
                    cleaned.append(None)
                elif v.startswith("'") and v.endswith("'"):
                    cleaned.append(v[1:-1].replace("\\'", "'").replace("''", "'").replace("\\", ""))
                elif v == 'CURRENT_TIMESTAMP':
                    cleaned.append(datetime.now())
                else:
                    try:
                        if re.match(r'^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$', v):
                            cleaned.append(datetime.strptime(v, '%Y-%m-%d %H:%M:%S') if ' ' in v else datetime.strptime(v, '%Y-%m-%d').date())
                        elif re.match(r'^-?\d+$', v):
                            cleaned.append(int(v))
                        elif re.match(r'^-?\d+\.\d+$', v):
                            cleaned.append(Decimal(v))
                        else:
                            try:
                                cleaned.append(json.loads(v))
                            except json.JSONDecodeError:
                                cleaned.append(v)
                    except ValueError:
                        cleaned.append(v)  # fallback to str if conversion fails

            parsed_rows.append(cleaned)

        return parsed_rows

    def import_users(self, file_path: Path):
        from accounts.models import User  # локальный импорт

        inserts = self.parse_inserts(file_path, 'tb_users')
        self.stdout.write(f"Найдено INSERT для tb_users: {len(inserts)}")

        for stmt in inserts:
            rows = self.parse_row_values(stmt)
            for values in rows:
                if len(values) < 10:
                    continue

                email = values[9] if len(values) > 9 else None
                if not email or not isinstance(email, str):
                    continue

                try:
                    dtb = datetime.strptime(values[4], '%Y-%m-%d').date() if values[4] and isinstance(values[4], str) else None
                    pspissuedt = datetime.strptime(values[5], '%Y-%m-%d').date() if values[5] and isinstance(values[5], str) else None
                    passport_val = values[8][:50] if values[8] else None  # обрезка для избежания DataError

                    user = User.objects.create(
                        id=int(values[0]),
                        name=values[1],
                        lname=values[2],
                        id_citizen=int(values[3]) if values[3] else None,
                        dtb=dtb,
                        pspissuedt=pspissuedt,
                        sex=values[6],
                        phone=values[7],
                        passport=passport_val,
                        email=email,
                        social_id=values[10] if len(values) > 10 else None,
                        social_type=values[11] if len(values) > 11 else None,
                        is_active=True,
                        role='admin' if 'admin' in email.lower() else 'agent',
                        password=make_password('admin2026'),
                    )
                    self.stdout.write(self.style.SUCCESS(f"Создан пользователь: {user.email}"))
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"Ошибка создания пользователя {email}: {e}"))
                    raise  # для отката транзакции

    def import_categories(self, file_path: Path):
        from hotels.models import Category  # локальный импорт

        inserts = self.parse_inserts(file_path, 'tb_categories')
        self.stdout.write(f"Найдено INSERT для tb_categories: {len(inserts)}")

        for stmt in inserts:
            rows = self.parse_row_values(stmt)
            for values in rows:
                if len(values) < 5:
                    continue

                try:
                    Category.objects.create(
                        id=int(values[0]),
                        name=values[1],
                        photo=values[2],
                        entry_by_id=int(values[3]) if values[3] else None,
                        is_active=bool(values[4]),
                    )
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"Ошибка категории: {e}"))
                    raise

    def import_vendors(self, file_path: Path):
        from vendors.models import Vendor  # локальный импорт

        inserts = self.parse_inserts(file_path, 'tb_vendors')
        self.stdout.write(f"Найдено INSERT для tb_vendors: {len(inserts)}")

        for stmt in inserts:
            rows = self.parse_row_values(stmt)
            for values in rows:
                if len(values) < 10:
                    continue

                try:
                    attributes = json.loads(values[10]) if isinstance(values[10], str) else (values[10] if isinstance(values[10], dict) else {})
                    bill_data = json.loads(values[11]) if isinstance(values[11], str) else (values[11] if isinstance(values[11], dict) else {})
                    Vendor.objects.create(
                        id=int(values[0]),
                        country_id=int(values[1]) if values[1] else None,
                        region_id=int(values[2]) if values[2] else None,
                        district_id=int(values[3]) if values[3] else None,
                        name=values[4],
                        category_id=int(values[5]) if values[5] else None,
                        is_active=bool(values[6]),
                        geo=values[7],
                        photo=values[8],
                        entry_by_id=int(values[9]),
                        attributes=attributes,
                        bill_data=bill_data,
                        address=values[12] if len(values) > 12 else None,
                    )
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"Ошибка вендора id={values[0]}: {e}"))
                    raise

    def import_sights(self, file_path: Path):
        from hotels.models import Sight  # локальный импорт

        inserts = self.parse_inserts(file_path, 'tb_sights')
        self.stdout.write(f"Найдено INSERT для tb_sights: {len(inserts)}")

        for stmt in inserts:
            rows = self.parse_row_values(stmt)
            for values in rows:
                if len(values) < 15:
                    continue

                try:
                    is_foreg = Decimal(values[10]) if values[10] else Decimal('0')
                except (InvalidOperation, ValueError):
                    is_foreg = Decimal('0')

                try:
                    is_local = Decimal(values[11]) if values[11] else Decimal('0')
                except (InvalidOperation, ValueError):
                    is_local = Decimal('0')

                try:
                    opening_times = json.loads(values[13]) if isinstance(values[13], str) else (values[13] if isinstance(values[13], dict) else {})
                    extra_services = json.loads(values[14]) if isinstance(values[14], str) else (values[14] if isinstance(values[14], dict) else {})
                    required_conditions = json.loads(values[15]) if isinstance(values[15], str) else (values[15] if isinstance(values[15], dict) else {})
                    Sight.objects.create(
                        id=int(values[0]),
                        vendor_id=int(values[1]),
                        category_id=int(values[2]) if values[2] else None,
                        name=values[3],
                        description=values[4],
                        sh_description=values[5],
                        address=values[6],
                        geolocation=values[7],
                        images=values[8],
                        status=values[9],
                        is_foreg=is_foreg,
                        is_local=is_local,
                        max_capacity=int(values[12]) if values[12] else None,
                        opening_times=opening_times,
                        extra_services=extra_services,
                        required_conditions=required_conditions,
                        enable_tickets=bool(values[16]) if len(values) > 16 else False,
                        created_by_id=int(values[17]) if len(values) > 17 else None,
                    )
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"Ошибка sight id={values[0]}: {e}"))
                    raise

    def import_tickets(self, file_path: Path):
        from hotels.models import Ticket  # локальный импорт

        inserts = self.parse_inserts(file_path, 'tb_tickets')
        self.stdout.write(f"Найдено INSERT для tb_tickets: {len(inserts)}")

        for stmt in inserts:
            rows = self.parse_row_values(stmt)
            for values in rows:
                if len(values) < 8:
                    continue

                try:
                    Ticket.objects.create(
                        id=int(values[0]),
                        sight_id=int(values[1]),
                        vendor_id=int(values[2]),
                        created_by_id=int(values[3]) if values[3] else None,
                        total_qty=int(values[4]),
                        total_amount=Decimal(values[5]),
                        is_paid=bool(values[6]),
                        is_valid=bool(values[7]),
                    )
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"Ошибка ticket id={values[0]}: {e}"))
                    raise

if __name__ == "__main__":
    # Для запуска скрипта напрямую без manage.py
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "silkroad_backend.settings")
    django.setup()

    parser = argparse.ArgumentParser(description="Импорт данных из Laravel SQL-дампа")
    parser.add_argument(
        "--file",
        type=str,
        default="C:/OSPanel/home/silkroad.local/silkroad_27_07.sql",
        help="Полный путь к файлу дампа (например C:/OSPanel/home/silkroad.local/silkroad_27_07.sql)"
    )
    try:
        args = parser.parse_args()
    except SystemExit:
        print("Подсказка: Укажите --file с путём к SQL-дампу, или используйте default (C:/OSPanel/home/silkroad.local/silkroad_27_07.sql)")
        sys.exit(1)

    command = Command()
    command.handle(file=args.file)