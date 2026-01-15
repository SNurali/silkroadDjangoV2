import os
from pathlib import Path
from urllib.parse import urlparse

from django.core.management.base import BaseCommand
from django.conf import settings

from hotels.models import Sight, SightImage


MEDIA_SIGHTS_ROOT = Path(settings.MEDIA_ROOT) / "sights"


class Command(BaseCommand):
    help = "Smart migration: bind existing media files to Sight by filename"

    def handle(self, *args, **options):
        if not MEDIA_SIGHTS_ROOT.exists():
            self.stderr.write(
                self.style.ERROR(f"Папка не найдена: {MEDIA_SIGHTS_ROOT}")
            )
            return

        # === 1. Индексация всех файлов ===
        self.stdout.write("Индексация файлов...")
        file_index = {}

        for root, _, files in os.walk(MEDIA_SIGHTS_ROOT):
            for fname in files:
                if fname.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                    if fname not in file_index:
                        file_index[fname] = Path(root) / fname

        self.stdout.write(
            self.style.SUCCESS(f"Найдено файлов: {len(file_index)}")
        )

        # === 2. Связка с Sight ===
        sights = Sight.objects.exclude(images="").exclude(images__isnull=True)

        for sight in sights:
            urls = [u.strip() for u in sight.images.split(",") if u.strip()]
            self.stdout.write(f"\nSight #{sight.id}: {len(urls)} изображений")

            for url in urls:
                filename = os.path.basename(urlparse(url).path)

                if not filename:
                    continue

                if SightImage.objects.filter(
                    sight=sight, original_path=url
                ).exists():
                    self.stdout.write(f"  ↩ уже связано: {filename}")
                    continue

                file_path = file_index.get(filename)

                if not file_path:
                    self.stdout.write(
                        self.style.ERROR(f"  ✖ файл не найден: {filename}")
                    )
                    continue

                # относительный путь от MEDIA_ROOT
                relative_path = file_path.relative_to(settings.MEDIA_ROOT)

                SightImage.objects.create(
                    sight=sight,
                    image=str(relative_path),
                    original_path=url
                )

                self.stdout.write(
                    self.style.SUCCESS(f"  ✔ связано: {relative_path}")
                )

        self.stdout.write(self.style.SUCCESS("\nМиграция завершена"))
