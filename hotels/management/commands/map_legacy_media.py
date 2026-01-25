from django.core.management.base import BaseCommand
from hotels.models import Hotel
from vendors.models import MediaFile

class Command(BaseCommand):
    help = 'Resolves legacy image IDs (image_id, banner_image_id, gallery) to file paths in Hotel.images'

    def handle(self, *args, **options):
        hotels = Hotel.objects.all()
        updated_count = 0
        
        for hotel in hotels:
            paths = []
            
            # 1. Main Image
            if hotel.image_id:
                mf = MediaFile.objects.filter(id=hotel.image_id).first()
                if mf and mf.file_path:
                    paths.append(mf.file_path)
            
            # 2. Banner Image
            if hotel.banner_image_id:
                mf = MediaFile.objects.filter(id=hotel.banner_image_id).first()
                if mf and mf.file_path:
                    paths.append(mf.file_path)

            # 3. Gallery (legacy CSV IDs)
            if hotel.gallery:
                # Format: "101,102,103"
                try:
                    ids = [int(x) for x in hotel.gallery.split(',') if x.strip().isdigit()]
                    files = MediaFile.objects.filter(id__in=ids)
                    # MediaFile order is not guaranteed, but usually fine
                    for mf in files:
                        if mf.file_path:
                            paths.append(mf.file_path)
                except Exception:
                    pass
            
            # Update Hotel.images field (Text, comma separated)
            # Only if we found new images and it's currently empty or we want to overwrite legacy paths
            if paths:
                # Prepend /media/ if not already there, legacy paths often are relative
                # or absolute but local.
                # Assuming MediaFile.file_path is relative like "hotels/1.jpg"
                
                # Check current images
                current_images = []
                if hotel.images:
                    current_images = [x.strip() for x in hotel.images.split(',') if x.strip()]
                
                # Merge unique
                final_list = []
                # Add existing text paths first (if they look like paths)
                for p in current_images:
                    if p not in final_list: 
                        final_list.append(p)
                
                # Add resolved paths
                for p in paths:
                    # Normalized path
                    p_norm = p.strip()
                    if p_norm not in final_list:
                        final_list.append(p_norm)
                
                hotel.images = ",".join(final_list)
                hotel.save()
                updated_count += 1
                
        self.stdout.write(self.style.SUCCESS(f"Updated images for {updated_count} hotels."))
