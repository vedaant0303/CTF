import os
from PIL import Image, ImageDraw

def generate_app_icon():
    size = (256, 256)
    # Create image with transparent background
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Outer rounded rect / badge background
    # Colors: Dark Slate background (#0f172a), Emerald/Teal accents (#0d9488, #10b981)
    margin = 12
    draw.rounded_rectangle([margin, margin, size[0]-margin, size[1]-margin], radius=48, fill=(15, 23, 42, 255), outline=(13, 148, 136, 255), width=6)

    # Inner shield shape
    shield_pts = [
        (128, 48),   # top center
        (196, 76),   # top right
        (184, 156),  # mid right
        (128, 208),  # bottom tip
        (72, 156),   # mid left
        (60, 76)     # top left
    ]
    draw.polygon(shield_pts, fill=(13, 148, 136, 220), outline=(52, 211, 153, 255))

    # Inner terminal / bracket / lock symbol
    # Left chevron '<'
    draw.line([(100, 110), (86, 126), (100, 142)], fill=(255, 255, 255, 255), width=5)
    # Right chevron '>'
    draw.line([(156, 110), (170, 126), (156, 142)], fill=(255, 255, 255, 255), width=5)
    # Center keyhole / dot
    draw.ellipse([120, 118, 136, 134], fill=(255, 255, 255, 255))
    draw.rectangle([124, 132, 132, 144], fill=(255, 255, 255, 255))

    out_dir = os.path.join(os.path.dirname(__file__), '..', 'build')
    os.makedirs(out_dir, exist_ok=True)
    
    png_path = os.path.join(out_dir, 'icon.png')
    ico_path = os.path.join(out_dir, 'icon.ico')

    img.save(png_path, format='PNG')
    # Save multi-size ICO
    img.save(ico_path, format='ICO', sizes=[(16,16), (32,32), (48,48), (64,64), (128,128), (256,256)])
    print(f"Generated {png_path} and {ico_path}")

if __name__ == '__main__':
    generate_app_icon()
