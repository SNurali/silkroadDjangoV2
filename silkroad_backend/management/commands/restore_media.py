import os
import shutil
from django.core.management.base import BaseCommand
from django.conf import settings
from hotels.models import Sight

class Command(BaseCommand):
    help = 'Restore missing media files with placeholders'

    def handle(self, *args, **options):
        # Source placeholder (Hero image)
        # We assume it exists at the location we saved earlier
        hero_path = '/home/mrnurali/.gemini/antigravity/brain/abaead10-79e4-4cde-9741-4d1ddf896194/silk_road_hero_1769096479411.png'
        
        if not os.path.exists(hero_path):
             self.stdout.write(self.style.ERROR("Placeholder source not found"))
             return

        sights = Sight.objects.all()
        count = 0
        for sight in sights:
            images = sight.get_images_list()
            for img_url in images:
                # img_url is like /media/images/permanent/...
                # We need filesystem path: BASE_DIR + /media/ + ... (minus /media/ prefix)
                
                # Strip /media/
                rel_path = img_url.replace('/media/', '', 1)
                full_path = os.path.join(settings.MEDIA_ROOT, rel_path)
                
                if not os.path.exists(full_path):
                    os.makedirs(os.path.dirname(full_path), exist_ok=True)
                    shutil.copy(hero_path, full_path)
                    self.stdout.write(f"Restored {rel_path}")
                    count += 1
        
        self.stdout.write(self.style.SUCCESS(f"Restored {count} images"))
