# Passla — Statik Web Sitesi

Mağaza yayını için **gizlilik politikası**, **kullanım koşulları**, **hesap silme** ve **destek** sayfaları.

## Dosyalar

| Dosya | URL |
|-------|-----|
| `index.html` | `https://passla.com.tr/` |
| `gizlilik.html` | `https://passla.com.tr/gizlilik.html` |
| `kullanim-kosullari.html` | `https://passla.com.tr/kullanim-kosullari.html` |
| `hesap-silme.html` | `https://passla.com.tr/hesap-silme.html` |
| `destek.html` | `https://passla.com.tr/destek.html` |

Mağaza formlarına girilecek URL'ler:

| Alan | URL |
|------|-----|
| Play Store / App Store gizlilik politikası | `https://passla.com.tr/gizlilik.html` |
| Play Console → Veri güvenliği → hesap silme URL'si | `https://passla.com.tr/hesap-silme.html` |
| App Store Connect → EULA / Kullanım koşulları | `https://passla.com.tr/kullanim-kosullari.html` |

> **Yayın öncesi:** `gizlilik.html` ve `kullanim-kosullari.html` içindeki köşeli
> parantezli alanlar (şirket unvanı, adres, VKN/MERSİS, yetkili mahkeme ili)
> ticaret sicil bilgileriyle doldurulmalıdır.

## Cloudflare + Oracle (önerilen)

1. Cloudflare Free → [`docs/CLOUDFLARE_SETUP.md`](../docs/CLOUDFLARE_SETUP.md)
2. Natro'da sadece nameserver değiştir
3. Cloudflare A kayıtları: `@` + `api` → `150.230.158.219`

Sunucuda (repo clone sonrası):

```bash
cd BARTER_EXCHANGE/takkas-backend
sudo bash deploy/scripts/setup-passla-production.sh passla.com.tr
```

Sadece statik site (SSL sonra):

```bash
sudo bash deploy/scripts/setup-passla-website.sh passla.com.tr
```

## Lokal test

```bash
cd website
npx serve .
# http://localhost:3000/gizlilik.html
```

## Uygulama eşleştirme

- [`bex/app.json`](../bex/app.json) → `privacyPolicyUrl`: `https://passla.com.tr/gizlilik.html`
- Destek e-postası: `destek@passla.com.tr`
