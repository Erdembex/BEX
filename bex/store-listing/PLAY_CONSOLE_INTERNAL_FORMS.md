# Play Console — Internal test form rehberi (Passla)

Paket: **com.passla.app** · Sürüm: **1.0.2** · **versionCode 9**  
Kapalı test AAB: https://expo.dev/artifacts/eas/BT5Vi-yNEbF6x3w9NB9dQN1htWAjszZfZm1z3baLp84.aab  
Adımlar: `KAPALI_TEST_VC9.md` · Tester listesi: `testers.csv`

URL doğrulama (2026-09): tümü **HTTP 200**

| URL | Kullanım |
|-----|----------|
| https://passla.com.tr/gizlilik.html | Mağaza, gizlilik, veri güvenliği |
| https://passla.com.tr/kullanim-kosullari.html | Uygulama içi şartlar |
| https://passla.com.tr/hesap-silme.html | Hesap silme (web) |
| https://passla.com.tr/destek.html | Destek sayfası |
| destek@passla.com.tr | İletişim e-postası |
| https://api.passla.com.tr/actuator/health | Backend (test notu) |

---

## 1. Mağaza girişi (TR)

**Büyüt → Mağaza varlığı → Ana mağaza girişi → Türkçe**

| Alan | Değer |
|------|--------|
| Uygulama adı | Passla |
| Kısa açıklama | `Görevi sen yap, hizmeti işletme sunsun. Beceri takası — nakit yok.` |
| Tam açıklama | `play-store-tr.txt` dosyasındaki “Uzun açıklama” bölümü (satır 7–29) |
| Simge | `bex/assets/icon.png` (512×512) |
| Telefon ekran görüntüleri | En az **2** PNG (1080×1920+). Üret: `python bex/store-listing/screenshots/_generate.py` veya `Desktop/Passla-Play-Console-Gorseller/` |
| Gizlilik politikası URL | https://passla.com.tr/gizlilik.html |
| E-posta | destek@passla.com.tr |

İngilizce giriş açıksa: `play-store-en.txt` aynı alanlara.

---

## 2. Uygulama içeriği (Politika)

### Gizlilik politikası
- URL: https://passla.com.tr/gizlilik.html

### Reklamlar
- **Hayır** — uygulama reklam içermiyor

### İçerik derecelendirme (IARC)
- Tür: Uygulama  
- Hedef: **13+** (reşit olmayanlar için uygun değil / 13 ve üzeri)  
- Şiddet, kumar, yetişkin içerik: **Hayır**  
- Kullanıcı etkileşimi / paylaşım: mesajlaşma var → ankete göre **Evet** (sohbet), dürüst cevap

### Hedef kitle ve içerik
- Hedef yaş: **13 yaş ve üzeri**  
- Çocuklara yönelik değil

### Veri güvenliği (özet — formda tek tek işaretle)

| Veri | Toplanıyor | Paylaşım | Amaç | Zorunlu |
|------|------------|----------|------|---------|
| E-posta, ad | Evet | Hayır (3. taraf reklam yok) | Hesap | Evet (kayıt) |
| Kullanıcı kimliği | Evet | Hayır | Oturum | Evet |
| Mesajlar | Evet (kullanınca) | Hayır | Sohbet / görev | Hayır |
| Konum | Evet (izinle) | Hayır | İl/ilçe, yakın görev | Hayır |
| Fotoğraflar / galeri | Evet (izinle) | Hayır | Teslim, sohbet | Hayır |
| Kamera | Evet (izinle) | Hayır | QR, teslim | Hayır |

- Veri aktarımı: **şifreli (HTTPS)**  
- Kullanıcı veri silme talebi: **Evet**  
- Hesap silme URL: https://passla.com.tr/hesap-silme.html  
- Uygulama içi: Ayarlar → hesap silme akışı

### Hesap silme (Google politikası)
- Uygulama içi silme: **Var**  
- Web: https://passla.com.tr/hesap-silme.html

---

## 3. Kapalı test sürümü (versionCode 9)

Dahili test yalnızca listedeki tek hesabı indirir. Üretim öncesi kanal **Kapalı test**.

1. [Play Console](https://play.google.com/console) → **Passla**
2. **Test edin ve yayınlayın → Kapalı test → Yeni sürüm**
3. AAB: https://expo.dev/artifacts/eas/BT5Vi-yNEbF6x3w9NB9dQN1htWAjszZfZm1z3baLp84.aab
4. Sürüm adı: `1.0.2 (9)`
5. Sürüm notları: `INTERNAL_TEST_RELEASE_NOTES.txt`
6. **Test kullanıcıları:** `testers.csv` içindeki adresleri kendi listenle değiştir (15 kişi)
7. Ayrıntı: `KAPALI_TEST_VC9.md`

---

## 4. Repoda senin işaretlemen gerekenler (Console dışı)

| Madde | Durum |
|-------|--------|
| Production AAB (vc 9) | ✅ Expo artifact hazır; Play’e sen yüklersin |
| Kapalı test listesi | `testers.csv` şablonu — adresleri sen doldur |
| Play formları (yukarı) | Console’da sen doldur |
| Ekran görüntüsü min 2 | Klasör boşsa `_generate.py` veya cihazdan çek |
| `google-play-service-account.json` | Yoksa manuel AAB yükleme |
| FCM V1 (production) | Push için `eas credentials -p android` |

---

## 5. Sık hata

- **Yeni sürüm oluştur** gri: Dashboard’da eksik politika / mağaza girişi  
- **Version code** zaten kullanıldı: bir üst build (EAS autoIncrement)  
- **Harita**: Uygulamada hub haritası kaldırıldı; mağaza metninde “yakındaki görevler” il/ilçe filtresi anlamında geçerli

