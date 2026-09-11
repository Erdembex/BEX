# Passla — Store Ekran Görüntüleri

Mağaza yayını için minimum **2 telefon ekran görüntüsü** gerekir.

## Önerilen ekranlar

1. **Giriş / kayıt** — Passla logosu, altın/mor tema
2. **Görev listesi** — yakındaki görevler
3. **Profil** — bio, beceriler, CV (opsiyonel)
4. **Takas / kupon** — QR veya kupon ekranı

## Boyutlar

| Platform | Boyut |
|----------|-------|
| Play Store (telefon) | 1080×1920 veya daha yüksek, 16:9 veya 9:16 |
| App Store 6.7" | 1290×2796 |
| App Store 6.5" | 1284×2778 |

## Nasıl alınır

1. Android emülatör veya fiziksel telefon
2. `preview-phone` APK veya Expo Go
3. Ekran görüntüsü al → `bex/store-listing/screenshots/` klasörüne kaydet (git'e eklenebilir)

Canlı çekim yokken taslak üretmek için:

```bash
python bex/store-listing/screenshots/_generate.py
```

Gerçek cihaz çekimi geldiğinde aynı dosya adlarının üzerine yazın.

Sponsor sunumu da aynı görüntüleri kullanır. Beklenen dosya adları, demo hesaplar ve
çekim adımları: [`screenshots/README.md`](screenshots/README.md)

## Listing metinleri

- TR: [`play-store-tr.txt`](play-store-tr.txt)
- EN: [`play-store-en.txt`](play-store-en.txt)
- App Store: [`app-store-tr.txt`](app-store-tr.txt)
- Metadata: [`metadata.json`](metadata.json)
