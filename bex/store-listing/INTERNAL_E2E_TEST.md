# Passla — Internal test uçtan uca kontrol listesi

Production API: `https://api.passla.com.tr` · Paket: `com.passla.app`

Her yeni AAB yüklemesinden sonra aşağıdaki akışları **gerçek cihazda** işaretle.

---

## 0 — Kurulum

- [ ] Internal test track’ten uygulamayı yükle (Expo Go değil)
- [ ] İnternet açık, bildirim izni sorulduysa kabul et
- [ ] Konum izni (harita / yakın görevler) ver

---

## 1 — Bireysel kullanıcı

- [ ] Kayıt → e-posta doğrulama → giriş
- [ ] Onboarding (ilk kurulum) bir kez görünür, bitince tekrar dönmez
- [ ] Profil: foto, isim, il/ilçe, bio kaydedilir
- [ ] Görevler: şehir filtresi, ilan detayı, başvuru
- [ ] Mesajlar: başvuru sonrası sohbet açılır, mesaj gider/gelir
- [ ] Teslim: foto/metin yükleme
- [ ] Cüzdan: onay sonrası kupon görünür
- [ ] QR: işletme tarafında doğrulama (bkz. bölüm 2)

---

## 2 — İşletme hesabı

- [ ] İşletme kaydı / giriş
- [ ] Konum + açık adres kaydı (harita pin’i için zorunlu)
- [ ] Görev oluştur → admin/onay akışı (ortamınıza göre)
- [ ] Başvuruları gör, kabul/red
- [ ] Teslim onayı → kupon oluştur
- [ ] QR ile kupon okut / kullan

---

## 3 — Harita

- [ ] Hub → Harita: şehir seçiliyse karolar yüklenir (boş gri ekran yok)
- [ ] Pin’lere dokun → ilan detayına git
- [ ] İlçe filtresi pin sayısını mantıklı daraltır
- [ ] Android: mavi nokta (konumum) izin verince görünür

**Harita boşsa:** Play/EAS’te `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` tanımlı mı; işletmelerde il/ilçe/açık adres ve backend’de latitude dolu mu kontrol et.

---

## 4 — Bildirimler

- [ ] Uygulama arka plandayken test push (başvuru / mesaj)
- [ ] Bildirime dokununca doğru ekrana gider
- [ ] Rozet sayısı güncellenir

---

## 5 — Abonelik (işletme)

- [ ] Abonelik ekranı planları listeler
- [ ] Yükseltme talebi → referans kodu mesajı (manuel ödeme modu)
- [ ] Admin panelden ödeme onayı sonrası plan ACTIVE

---

## 6 — Ayarlar / hesap

- [ ] Ayarlar: dil, tema, önbellek — **profil düzenleme yok** (profil sekmesinde)
- [ ] Engellenen kullanıcılar
- [ ] Veri indir / hesap sil linkleri açılır

---

## Build komutu

```powershell
cd bex
npm run build:production:android
```

Build bitince Play Console → Internal testing → yeni sürüm → AAB yükle.

Release notları: `store-listing/INTERNAL_TEST_RELEASE_NOTES.txt`
