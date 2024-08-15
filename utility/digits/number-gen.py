# (A) IMPORT PILLOW
from PIL import Image, ImageFont, ImageDraw 

# (B) SETTINGS
sText = "1"                         # text to write
sFont = "/Users/mark.greynolds/My Drive/SpecialProjects/DevCon2024/stop-watch/fonts/Stopwatch.ttf" # font file
sSize = 44                      # font size
sColor = (38, 91, 179)             # text color
sPos = (-1, -40)                      # write text at this position

# (C) WRITE TEXT TO IMAGE + SAVE

for digit in range(0, 10):
    iOpen = Image.new("RGB", (20,35), color=(255, 255, 255))
    iDraw = ImageDraw.Draw(iOpen)
    iFont = ImageFont.truetype(sFont, sSize)
    iDraw.text(sPos, f"{digit}", fill=sColor, font=iFont)
    iOpen.save(f"digit-{digit}.png")