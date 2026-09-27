# Passla — Internal test uçtan uca kontrol listesi



Production API: `https://api.passla.com.tr` · Paket: `com.passla.app` · Son AAB: **1.0.2 (versionCode 5)**



Her yeni AAB yüklemesinden sonra aşağıdaki akışları **gerçek cihazda** (Play dahili test, Expo Go değil) işaretle.



---



## 0 — Kurulum



- [ ] Dahili test track’ten uygulamayı yükle

- [ ] İnternet açık; bildirim izni (push testi için)

- [ ] Konum izni (il/ilçe / yakın görev filtresi için, isteğe bağlı)



---



## 1 — Bireysel kullanıcı



- [ ] Kayıt → e-posta doğrulama → giriş

- [ ] Onboarding bir kez görünür

- [ ] Hub: sol **menü**, sağ **profil**; profilde **geri** → hub

- [ ] Profil sekmesi / avatar: profil düzenleme

- [ ] Görevler: şehir filtresi, detay, başvuru

- [ ] Mesajlar, teslim (foto/metin), cüzdan, QR (işletme doğrulama)



---



## 2 — İşletme hesabı



- [ ] Giriş → varsayılan **Panel**; alt barda **Panel** sekmesi

- [ ] Açık adres + il/ilçe kaydı

- [ ] Görev oluştur (+); **2 aktif** dolunca yeni görev engeli

- [ ] Sohbetten **özel iş ilanı**: 2/2 doluyken engel; bekleyen ilanı güncellerken slot boşalır

- [ ] Başvuru kabul/red, teslim onayı, kupon, QR okutma

- [ ] Başvuru detayında aday CV (yetkili işletme)



---



## 3 — Bildirimler



- [ ] Arka planda push (FCM production credential + dahili AAB)

- [ ] Bildirime dokununca doğru ekran; rozet güncellenir



---



## 4 — Abonelik (işletme)



- [ ] Plan listesi; manuel yükseltme referans kodu

- [ ] (Opsiyonel) Admin ödeme onayı → ACTIVE plan



---



## 5 — Ayarlar / hesap



- [ ] Ayarlar: dil, tema (profil düzenleme profil sekmesinde)

- [ ] Gizlilik / kullanım / hesap silme linkleri: passla.com.tr



---



## Build / yükleme



```powershell

cd bex

npm run build:production:android

```



Play Console → Dahili test → Yeni sürüm → `.aab`  

Sürüm notları: `store-listing/INTERNAL_TEST_RELEASE_NOTES.txt`



Form rehberi: `store-listing/PLAY_CONSOLE_INTERNAL_FORMS.md`


