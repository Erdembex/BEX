# -*- coding: utf-8 -*-
from PIL import Image, ImageDraw

SRC = r"C:\Users\ERDEM\.cursor\projects\c-Users-ERDEM-Desktop-BEX-CURSOR\assets\onboard-a1b.png"
MARK = r"c:\Users\ERDEM\Desktop\BEX_CURSOR\bex\assets\branding\passla-mark-white@3x.png"
OUT = r"C:\Users\ERDEM\.cursor\projects\c-Users-ERDEM-Desktop-BEX-CURSOR\assets\onboard-a1d.png"

im = Image.open(SRC).convert("RGBA")
navy = (2, 27, 55)

d = ImageDraw.Draw(im)
# makas + canta — duvar rengi ile kapat
d.rounded_rectangle((450, 250, 760, 445), 8, fill=(*navy, 255))

# temiz duvar parcasini klonla (sol-ust duvar)
src_box = (470, 250, 560, 310)
patch = im.crop(src_box)
# yay
for ox, oy in ((455, 255), (530, 255), (600, 255), (455, 320), (530, 320), (600, 320)):
    im.paste(patch, (ox, oy))

# tekrar duvar rengi ile yumusat
d = ImageDraw.Draw(im)
d.rounded_rectangle((450, 250, 760, 445), 6, fill=(*navy, 255))

mark = Image.open(MARK).convert("RGBA")
mw = 72
mh = int(mark.height * (mw / mark.width))
mark = mark.resize((mw, mh), Image.Resampling.LANCZOS)
# laptop arkasinda / hemen ustunde
im.paste(mark, (500, 348), mark)

im.convert("RGB").save(OUT, "PNG")
print("saved", OUT)
