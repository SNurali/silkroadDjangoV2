from PIL import Image
import os

source_path = "/home/mrnurali/.gemini/antigravity/brain/b5105940-e929-49b0-8a4b-6e993b673997/silkroad_favicon_1769253218398.png"
dest_path = "/home/mrnurali/PycharmProjects/SilkRoad/silkroadDjangoV2/silkroad-frontend/public/favicon.ico"

print(f"Opening {source_path}")
img = Image.open(source_path)

# Resize to standard icon sizes
icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]

print(f"Saving to {dest_path}")
img.save(dest_path, format='ICO', sizes=icon_sizes)
print("Done.")
