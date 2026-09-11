# Ekran Görüntüleri — Çekim Rehberi

Bu klasör hem mağaza yayını hem sponsor sunumu için kullanılır. Sunum scriptleri
(`sunum/_passla_build.py`) buradaki dosyaları **tam bu adlarla** arar; dosya yoksa
o slaytta yer tutucu çizer, sunum yine üretilir.

## Beklenen dosyalar

| Dosya adı | Ekran | Sunumda nerede |
|-----------|-------|----------------|
| `01_hub.png` | Ana sayfa — 8 kartlı hub | Pilot ve yatırımcı: ürün slaytı |
| `02_gorevler.png` | Görev listesi + arama açık | Pilot: nasıl çalışır |
| `03_gorev_detay.png` | Görev detayı (ödül görünür) | Yatırımcı: ürün slaytı |
| `04_sohbet.png` | Sohbet + teklif balonu | Yatırımcı: etkileşim |
| `05_kupon_qr.png` | Kupon QR ekranı | Pilot: doğrulama güveni |
| `06_takas.png` | Takas pazarı listesi | Yatırımcı: farklılaşma |
| `07_isletme_panel.png` | İşletme görev oluşturma | Pilot: işletme deneyimi |

## Çekim öncesi hazırlık

1. Backend'i demo verisiyle başlat:

```bash
# takkas-backend/.env veya ortam değişkeni
DEMO_SEED_ENABLED=true
DEMO_PASSWORD=PasslaDemo1!
```

Seeder üç demo işletme, altı görev, iki tamamlanmış görev akışı, bir aktif kupon
ve bir takas ilanı oluşturur. Detay: `docs/DEMO_SENARYOSU.md`.

2. Uygulamayı demo hesapla aç:

| Rol | E-posta | Şifre |
|-----|---------|-------|
| Birey (kuponu olan) | `mert@demo.passla.com.tr` | `PasslaDemo1!` |
| Birey (takas ilanı olan) | `ayse@demo.passla.com.tr` | `PasslaDemo1!` |
| İşletme | `salon@demo.passla.com.tr` | `PasslaDemo1!` |

## Boyut kuralları

| Platform | Boyut |
|----------|-------|
| Play Store (telefon) | en az 1080×1920, 9:16 |
| App Store 6.7" | 1290×2796 |
| App Store 6.5" | 1284×2778 |

Sunum için 1080×1920 yeterlidir; script görüntüyü oranını bozmadan ölçekler.

## Nasıl çekilir

**Android fiziksel cihaz (önerilen)**

1. Preview APK'yı kur (EAS build linki).
2. Ekran görüntüsü al (Güç + Ses kısma).
3. Bilgisayara aktar, yukarıdaki adlarla bu klasöre kaydet.

**Android emülatör**

```bash
adb exec-out screencap -p > 01_hub.png
```

**iOS simülatör**

```bash
xcrun simctl io booted screenshot 01_hub.png
```

## Kalite kontrol

- Durum çubuğunda saat ve şarj makul görünsün, bildirim kalabalığı olmasın.
- Gerçek kişi adı, gerçek telefon numarası veya gerçek e-posta görünmesin; demo verisi kullan.
- Boş liste ekranı çekme; demo verisi yüklü olduğundan emin ol.
- Karanlık/aydınlık temayı tüm görüntülerde aynı tut.
