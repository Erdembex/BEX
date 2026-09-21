# Play Console — Görsellerden sonra ne yapmalısın?

Görseller: `Desktop/Passla-Play-Console-Gorseller/`

## 1. Mağaza girişi (Store listing)

**Büyüt → Mağaza varlığı → Ana mağaza girişi → Türkçe**

| Alan | Ne yükle |
|------|-----------|
| Telefon ekran görüntüleri | `telefon-01-ana-sayfa` + `telefon-02-giris` (PNG veya JPG) |
| 7 inç tablet | `tablet-7-01` + `tablet-7-02` |
| 10 inç tablet | `tablet-10-01` + `tablet-10-02` |
| Chromebook | `chromebook-01` + `chromebook-02` |
| Android XR | `android-xr-01` + `android-xr-02` |
| Uygulama simgesi | `bex/assets/icon.png` |
| Öne çıkan grafik | `bex/store-listing/feature-graphic-1024x500.png` |
| Kısa / uzun açıklama | `bex/store-listing/play-store-tr.txt` |

İngilizce dil eklediysen aynı görselleri EN girişine de yükle; metin: `play-store-en.txt`.

**Kaydet** — “Bazı dillerde hata var” uyarısı genelde eksik ekran görüntüsü veya boş açıklama demektir; TR ve EN’i tek tek kontrol et.

---

## 2. Internal test sürümü

1. **Test et ve yayınla → Internal testing → Yeni sürüm**
2. Son production AAB’yi yükle (`npm run build:production:android`)
3. Sürüm notları: `store-listing/INTERNAL_TEST_RELEASE_NOTES.txt`
4. **İncele → Yayınla**

---

## 3. Test kullanıcıları

**Internal testing → Testers** → e-posta listene kendini ekle → davet linki ile APK/AAB indir.

Expo Go değil; mağazadan gelen internal build ile test et.

---

## 4. Kontrol listeleri

- Formlar: `docs/PLAY_CONSOLE_INTERNAL_CHECKLIST.md`
- Uçtan uca test: `store-listing/INTERNAL_E2E_TEST.md`
- Harita / Maps key: `store-listing/PRODUCTION_READINESS.md`

---

## 5. İleride (isteğe bağlı)

- 3–5 telefon görüntüsü daha (görev listesi, mesaj, cüzdan QR) — demo veriyle çek, aynı klasör formatında
- Production track’e geçmeden önce closed test
