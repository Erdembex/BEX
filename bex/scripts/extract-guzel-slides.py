# -*- coding: utf-8 -*-
from PIL import Image
import os

SRC = r"C:\Users\ERDEM\.cursor\projects\c-Users-ERDEM-Desktop-BEX-CURSOR\assets\c__Users_ERDEM_AppData_Roaming_Cursor_User_workspaceStorage_9c4253bba673058a76103fb5eaf58e08_images_Passla-Onboarding-Guzel-0344c806-728e-401a-b93a-9791d410efc6.jpg"
OUT = r"c:\Users\ERDEM\Desktop\BEX_CURSOR\bex\assets\branding\onboarding"
os.makedirs(OUT, exist_ok=True)

im = Image.open(SRC).convert("RGB")
W, H = im.size
print("src", W, H)

# 3 telefon: ust baslik bari ~ %10, telefonlar yan yana
top = int(H * 0.12)
bot = int(H * 0.97)
phones = im.crop((0, top, W, bot))
pw, ph = phones.size

# her telefon neredeyse esit; kenar bosluk
margin = int(pw * 0.04)
inner = pw - margin * 2
col = inner // 3
gap = 0

for i in range(3):
    x0 = margin + i * col
    x1 = x0 + col
    phone = phones.crop((x0, 0, x1, ph))
    # header + notch kes, yazi alanini kes — sadece illüstrasyon
    cw, ch = phone.size
    art = phone.crop((int(cw * 0.08), int(ch * 0.08), int(cw * 0.92), int(ch * 0.46)))
    art = art.resize((1080, 720), Image.Resampling.LANCZOS)
    path = os.path.join(OUT, f"slide-{i + 1}.png")
    art.save(path, "PNG")
    print("saved", path, art.size)
