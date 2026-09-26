# Google Play Internal Test — Adım Adım (Passla)

Sürüm: **1.0.2** · Paket: **com.passla.app** · versionCode: **5** (EAS remote)

Form cevapları (kopyala-yapıştır): [`PLAY_CONSOLE_INTERNAL_FORMS.md`](PLAY_CONSOLE_INTERNAL_FORMS.md)

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

**Push (isteğe bağlı ama önerilir):** Android **production** profilde FCM V1 — `bex/docs/PUSH_NOTIFICATIONS.md`

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
| Kısa açıklama | `Görevi sen yap, hizmeti işletme sunsun. Beceri takası — nakit yok.` |
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
4. Sürüm adı: `1.0.2 (5)`
5. Sürüm notları (TR): [`INTERNAL_TEST_RELEASE_NOTES.txt`](INTERNAL_TEST_RELEASE_NOTES.txt) dosyasının tamamını yapıştır
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
- [x] Production AAB build (versionCode 5)
- [ ] Play Console formları → `PLAY_CONSOLE_INTERNAL_FORMS.md`
- [ ] Internal release yayın
- [ ] Tester e-postaları
