# Google Play Internal Test — Adım Adım (Passla)

Sürüm: **1.0.2** · Paket: **com.passla.app** · versionCode: **4**

---

## ADIM 1 — Backend ✅ (tamamlandı)

```
curl https://api.passla.com.tr/actuator/health → {"status":"UP"}
```

---

## ADIM 2 — EAS ortam değişkenleri ✅ (tamamlandı)

Production ortamında tanımlı:
- EXPO_PUBLIC_API_BASE_URL
- EXPO_PUBLIC_FIREBASE_*
- EXPO_PUBLIC_EAS_PROJECT_ID

**Eksik (opsiyonel):** `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` — harita için. Ekle:
```powershell
cd bex
npx eas env:create production --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value "SENIN_KEY" --visibility plaintext --scope project --force --non-interactive
```

---

## ADIM 3 — Ekran görüntüleri ✅ (taslak üretildi)

Dosyalar: `bex/store-listing/screenshots/`
- Play için min **2** yükle: `01_hub.png` + `02_gorevler.png` (veya 03, 05)
- Gerçek cihaz çekimi gelince aynı dosya adlarının üzerine yaz

---

## ADIM 4 — Production AAB build

Terminal:
```powershell
cd bex
npm run build:production:android
```

Build bitince: https://expo.dev/accounts/erdem1803/projects/bex/builds  
→ **Download** → `.aab` dosyasını kaydet

---

## ADIM 5 — Play Console: Uygulama

1. https://play.google.com/console
2. **Passla** (`com.passla.app`) — yoksa **Uygulama oluştur**
3. Uygulama adı: **Passla** · Dil: **Türkçe** · Ücretsiz

---

## ADIM 6 — Mağaza girişi (store listing)

**Büyüt → Mağaza varlığı → Ana mağaza girişi**

| Alan | Değer |
|------|--------|
| Uygulama adı | Passla |
| Kısa açıklama | `Görev yap, ödül kazan. Yakındaki işletme görevlerini tamamla, kupon kazan.` |
| Tam açıklama | `bex/store-listing/play-store-tr.txt` içindeki uzun metin |
| Uygulama simgesi | `bex/assets/icon.png` (512×512) |
| Öne çıkan grafik | 1024×500 (opsiyonel; yoksa atla) |
| Telefon ekran görüntüleri | `01_hub.png`, `02_gorevler.png` yükle |
| Gizlilik politikası | `https://passla.com.tr/gizlilik.html` |
| E-posta | `destek@passla.com.tr` |

**Kaydet**

---

## ADIM 7 — Uygulama içeriği formları

**Politika → Uygulama içeriği**

### 7a Gizlilik politikası
- URL: `https://passla.com.tr/gizlilik.html`

### 7b Reklamlar
- **Hayır, uygulamam reklam içermiyor**

### 7c İçerik derecelendirmesi
- Anketi başlat → Uygulama → **Herkes / 13+** (IARC)
- Şiddet/reklam yok → genelde **10+** veya **Genç** çıkar; sorulara dürüst cevap ver

### 7d Hedef kitle
- **13 yaş ve üzeri**

### 7e Veri güvenliği
Toplanan veriler (uygulamada var):
| Veri | Amaç | Zorunlu |
|------|------|---------|
| Konum (approx/precise) | Görev keşfi | Hayır (izinle) |
| Fotoğraflar | Görev teslimi, sohbet | Hayır |
| Kamera | QR, teslim | Hayır |
| E-posta, ad | Hesap | Evet (kayıt) |
| Mesajlar | Sohbet | Evet (kullanınca) |
| User IDs | Oturum | Evet |

- Veri **şifrelenerek** aktarılır (HTTPS)
- Kullanıcı **hesap silme** isteyebilir (uygulama içi + web)
- Veri silme URL: `https://passla.com.tr/hesap-silme.html`

### 7f Hesap silme
- Uygulama içi: Ayarlar → Hesabımı sil
- Web: `https://passla.com.tr/hesap-silme.html`

---

## ADIM 8 — Dahili test sürümü

1. **Test et ve yayınla → Test → Dahili test**
2. **Yeni sürüm oluştur**
3. **Yükle** → ADIM 4’te indirdiğin `.aab`
4. Sürüm adı: `1.0.2 (4)`
5. Sürüm notları (TR):
```
Passla 1.0.2 — Internal test

- Görev keşfi, başvuru, mesaj, cüzdan
- Misafir mod: Login → Şimdilik Atla
- Karanlık/aydınlık mod, bildirimler, hesap silme

Test: api.passla.com.tr
Demo: mert@demo.passla.com.tr / PasslaDemo1! (backend demo seed açıksa)
```
6. **Sürümü incele** → **Dahili teste dağıt**

---

## ADIM 9 — Test kullanıcıları

**Dahili test → Test kullanıcıları → E-posta listesi oluştur**

E-posta adreslerini ekle → **Kaydet** → tester linkini paylaş

---

## ADIM 10 — Telefonda doğrula

1. Tester linkinden Play Store’dan indir
2. Login → Şimdilik Atla → Görevler
3. Kayıt ol → e-posta doğrula
4. Ayarlar → Gizlilik / Hesap sil linkleri

---

## Otomatik submit (ileride)

`google-play-service-account.json` eklenince:
```powershell
npm run submit:android
```
Şimdilik **manuel AAB yükleme** (ADIM 8).

---

## Hızlı kontrol listesi

- [x] API health UP
- [x] EAS production env
- [x] Yasal URL’ler 200
- [x] Ekran görüntüsü taslakları
- [ ] Production AAB build
- [ ] Play Console formları
- [ ] Internal release yayın
- [ ] Tester e-postaları
