from PIL import Image

def remove_background(input_path, output_path):
    print(f"Processing {input_path}...")
    img = Image.open(input_path)
    img = img.convert("RGBA")
    
    datas = img.getdata()
    
    newData = []
    for item in datas:
        # Change all white (also shades of whites)
        # to transparent
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"Saved transparent logo to {output_path}")

try:
    remove_background("/home/mrnurali/Изображения/silkroad-logo-refined.png", "/home/mrnurali/PycharmProjects/SilkRoad/silkroadDjangoV2/silkroad-frontend/public/silkroad-logo-real-transparent.png")
except Exception as e:
    print(f"Error: {e}")
