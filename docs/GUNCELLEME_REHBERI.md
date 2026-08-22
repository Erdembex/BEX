# Passla — Ne Zaman Backend, Ne Zaman Sadece Uygulama?

**Kısa cevap:** Renk ve logo değişince backend’e dokunma. Yeni APK build yeter.

---

## Senaryo 1 — Renk / logo / tema (çoğu zaman bu)

| Değişecek | Dosyalar |
|-----------|----------|
| Renkler | `bex/src/theme/colors.ts`, `colorsLight.ts` |
| Logo / icon | `bex/assets/icon.png`, `splash-icon.png`, `assets/branding/` |
| App rengi | `bex/app.json` → `primaryColor`, `backgroundColor` |

**Komut (PC):**
```powershell
cd C:\Users\ERDEM\Desktop\BEX_CURSOR
.\scripts\update-branding.ps1          # kontrol listesi
.\scripts\build-preview-phone.ps1      # telefona yeni APK
```

**Backend deploy gerekmez.** API aynı kalır.

---

## Senaryo 2 — Backend kodu / API / veritabanı

Örnek: yeni endpoint, bug fix, migration (V32…).

```powershell
.\scripts\deploy-backend-oracle.ps1
.\scripts\verify-production-api.ps1 -BaseUrl https://api.passla.com.tr
```

---

## Senaryo 3 — Mağazaya yeni sürüm (uygulama çıkınca)

1. Renk/logo bitince → `build-preview-phone.ps1` veya production build  
2. Backend **değişmediyse** → backend komutu **yok**  
3. Play Console’a yeni APK/AAB yükle  

Her küçük renk denemesinde backend deploy **yapma**.

---

## Senaryo 4 — İlk kez / secrets (bir kere veya nadiren)

| Secret | Script |
|--------|--------|
| SendGrid | `.\scripts\apply-sendgrid-oracle.ps1` |
| AWS S3 | `.\scripts\apply-aws-s3-oracle.ps1` |
| Firebase SA | `bex\scripts\upload-firebase-sa.ps1` |

Bunlar renk/logo ile ilgili değil.

---

## Hızlı kontrol

```powershell
.\scripts\verify-production-api.ps1 -BaseUrl https://api.passla.com.tr
```

`Health UP` → backend hazır, sadece mobil tarafı güncelle.

---

## Agent’a ne söyle?

| İstek | Yeterli |
|-------|---------|
| “Renkleri şöyle yap” | Tema + logo dosyaları + APK |
| “Logoyu değiştir” | assets + APK |
| “Backend hazırla” | Sadece API/deploy/mail/S3 sorunu varsa |
| “Uygulama çıksın” | Store build + listing; backend zaten ayaktaysa tekrar deploy yok |

Renk tonlarını atınca **backend demene gerek yok** — doğrudan tonları gönder.
