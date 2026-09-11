# Passla Manuel QA Test Planı

> Son güncelleme: QA backlog maddeleri uygulandı (misafir mod, onboarding geri, store review gecikmesi, abonelik metinleri, 404, skeleton, izin açıklaması, önbellek, hata copy).

## Nasıl kullanılır

Her madde için: **Adım → Beklenen sonuç → Geçti/Kaldı → Not**

Önerilen ortam:
- **Expo Go** (hızlı UI testleri) + **EAS preview APK** (gerçek cihaz: bildirim, kilit, performans)
- Backend: `https://api.passla.com.tr` veya preview IP
- Test öncesi: uygulamayı tamamen sil → yeniden kur (temiz kurulum senaryosu)

Durum etiketleri:
- **TEST** — şimdi test edilebilir
- **ÖNCE GELİŞTİR** — kodda yok / eksik; test şu an kırmızıya düşer

---

## A. Hazırlık (5 dk)

| # | Durum | Adım | Beklenen |
|---|-------|------|----------|
| A1 | TEST | APK/EAS build veya Expo Go ile kur | Uygulama açılır, crash yok |
| A2 | TEST | İlk açılış: onboarding 3 slayt | 3 sayfa görünür (`bex/src/app/(auth)/onboarding.tsx`) |
| A3 | TEST | Onboarding içeriği markaya uygun mu? | Güncellenmiş 3 slayt metni (TR/EN i18n) |
| A4 | TEST | Slayt 1–2: **Atla** → login | Login ekranı açılır |
| A5 | TEST | Slayt 3: **Hemen Başla** / **Zaten hesabım var** | Login ekranı; uygulama kapanmaz |
| A6 | TEST | Her onboarding ekranında **Geri** + Android back | Geri slayta döner; ilk slaytta uygulama kapanmaz |
| A7 | TEST | Uygulamayı sil → tekrar kur | Onboarding tekrar gelir (`@passla/onboarding_complete_v1`) |

---

## B. Ağ ve dayanıklılık

| # | Durum | Adım | Beklenen |
|---|-------|------|----------|
| B1 | TEST | Uçak modu **AÇ** → uygulamayı kullan | Kırmızı **OfflineBanner** görünür; sonsuz spinner **olmamalı** |
| B2 | TEST | Görevler / cüzdan / mesajlar (offline) | Liste boş veya anlamlı hata; ekran donmamalı |
| B3 | TEST | Uçak modu **KAPAT** → **Yenile** / ekrana dön | Veri gelir; banner kaybolur |
| B4 | TEST | Backend kapalıyken kullan | Turuncu **BackendStatusBanner** + yeniden dene |
| B5 | TEST | Profil yüklenemezse (token bozuk) | `index.tsx` logout eder — sonsuz spinner olmaz |

**Kritik ekranlar spinner kontrolü** (her birinde max 5 sn bekle):
- Ana yönlendirme `index.tsx`
- Görevler `tasks/index.tsx` — skeleton var
- Cüzdan `wallet.tsx` — skeleton var
- Harita, mesaj inbox — skeleton; leaderboard, işletme paneli — ActivityIndicator

---

## C. Kilit / arka plan / performans

| # | Durum | Adım | Beklenen |
|---|-------|------|----------|
| C1 | TEST | Uygulama açıkken telefonu **kilitle** → 30 sn bekle → **aç** | **≤2 sn** içinde son ekran |
| C2 | TEST | Kronometre ile ölç | ≤2 sn hedef; 2–5 sn sarı; >5 sn kırmızı |
| C3 | TEST | Arka plandan tamamen kapat → tekrar aç | Soğuk açılış kabul; splash normal |
| C4 | TEST | 10 dk aktif gez | Aşırı ısınma / pil tüketimi not et |
| C5 | TEST | Ayarlar → depolama (telefon OS) vs APK boyutu | Uygulama GB’ları şişirmemeli |
| C6 | TEST | Ayarlarda önbellek boyutu / temizle | Boyut görünür; temizleme çalışır |

---

## D. Tema (karanlık / aydınlık)

| # | Durum | Adım | Beklenen |
|---|-------|------|----------|
| D1 | TEST | Ayarlar → Karanlık mod **AÇ** | Ana ekranlar okunaklı |
| D2 | TEST | Karanlık modda giriş ekranı | Graffiti arka plan + şeffaf form |
| D3 | TEST | Aydınlık mod **AÇ** | Krem zemin, lacivert metin |
| D4 | TEST | Mod değiştir → uygulamayı kapat-aç | Seçim kalır |
| D5 | TEST | ErrorBoundary crash testi | Aydınlık/karanlık modda okunaklı |
| D6 | TEST | Takas ekranı | Her iki modda kontrol et |

---

## E. Klavye

Her ekranda ilgili alana dokun → klavye aç → **aktif input görünür kalmalı**.

| Ekran | Dosya |
|-------|-------|
| Giriş | `login.tsx` |
| Kayıt | `register.tsx` |
| Şifremi unuttum / sıfırla | `forgot-password`, `reset-password` |
| Görev başvurusu | `task/apply/[id].tsx` |
| Görev teslimi | `task/submit/[id].tsx` |
| Mesaj kutusu | `ChatThreadView.tsx` |
| Takas ilanı | `TradeCreateListingModal.tsx` |
| Konum arama | `LocationSelectorModal.tsx` |

---

## F. Navigasyon ve geri tuşu

| # | Durum | Adım | Beklenen |
|---|-------|------|----------|
| F1 | TEST | Her modal / alt ekranda **Geri** veya **X** | Kolay çıkış |
| F2 | TEST | Android sistem geri (onboarding, login, hub) | Beklenmedik kapanma yok |
| F3 | TEST | Geçersiz görev ID | Anlamlı “bulunamadı” |
| F4 | TEST | Global 404 | `+not-found.tsx` — ana menü / görevlere dön |
| F5 | TEST | Ekranı **yan çevir** | Portrait; bozulmamalı |

---

## G. Misafir / giriş zorunluluğu

| # | Durum | Adım | Beklenen |
|---|-------|------|----------|
| G1 | TEST | Login’de **Şimdilik atla** | Hub açılır |
| G2 | TEST | Atla → hub, **görevler listelenir** | Public listings API |
| G3 | TEST | Başvur / mesaj / cüzdan / profil | GuestAuthGate → kayıt veya giriş |
| G4 | TEST | Login olmadan deep link | Login veya anlamlı mesaj |

---

## H. Hesap, ayarlar, yasal

| # | Durum | Adım | Beklenen |
|---|-------|------|----------|
| H1 | TEST | Ayarlar → **Hesabımı sil** | Uyarı, şifre, onay |
| H2 | TEST | Silme sonrası | Login; tekrar giriş yapılamaz |
| H3 | TEST | **Verilerimi indir** | JSON/export çalışır |
| H4 | TEST | Gizlilik / kullanım koşulları | Tarayıcıda açılır |

---

## I. İzinler

| İzin | Nerede | Beklenen |
|------|--------|----------|
| Bildirim | Login sonrası `NotificationPermissionPrompt` | In-app “neden” → OS diyaloğu |
| Konum | Harita, GPS | Kısmen; fallback |
| Kamera | QR scanner | Var |
| Galeri | Profil, sohbet | Red sonrası Alert |

---

## J. Hata mesajları

| # | Durum | Adım | Beklenen |
|---|-------|------|----------|
| J1 | TEST | Yanlış şifre | “E-posta veya şifre hatalı” |
| J2 | TEST | Offline kayıt/giriş | Ağı kontrol et yönlendirmesi |
| J3 | TEST | Generic hatalar | Aksiyon öner (tekrar dene, destek) |
| J4 | TEST | Prod’da dev mesajı sızıntısı | `axiosInstance.ts` — kullanıcı dostu copy |

---

## K. Ödeme / abonelik (işletme)

| # | Durum | Adım | Beklenen |
|---|-------|------|----------|
| K1 | TEST | Abonelik ekranı | Otomatik yenileme / iptal metinleri görünür |
| K2 | TEST | Mevcut POS metinleri | Manuel POS akışı anlaşılır |

---

## L. Bildirimler

| # | Durum | Adım | Beklenen |
|---|-------|------|----------|
| L1 | TEST | Push (APK) | Kilit + çekmece |
| L2 | TEST | Uygulama içi liste | NotificationListScreen |
| L3 | TEST | Bildirime dokun | Doğru ekrana gider |
| L4 | ÖNCE GELİŞTİR | Foreground push banner | Sadece sayaç güncellenir |

---

## M. Puanlama / “Beni puanla”

| # | Durum | Adım | Beklenen |
|---|-------|------|----------|
| M1 | TEST | Görev sonrası yıldız modal | PendingFeedbackGate |
| M2 | TEST | App Store / Play puan isteği | İlk kurulumda **çıkmamalı**; **1 gün sonra** (`storeReview.ts`) |
| M3 | TEST | Yeni kurulum → hemen puan | Çıkmamalı |

---

## N. Yükleme UX

| # | Durum | Adım | Beklenen |
|---|-------|------|----------|
| N1 | TEST | Görevler | TaskListSkeleton |
| N2 | TEST | Cüzdan, başvurular | Skeleton |
| N3 | TEST | Harita, mesaj inbox | MapScreenSkeleton, MessagesInboxSkeleton |
| N4 | TEST | HomeScreenSkeleton | Hub anında yüklenir; gerekirse ileride |

---

## O. Yeniden kurulum (regresyon)

1. Uygulamayı sil
2. Kur → onboarding → **Şimdilik atla** (misafir)
3. Görev listele → detay → başvur (gate)
4. Kayıt → e-posta doğrulama → giriş
5. Görev başvur → mesaj → bildirim (APK)
6. Karanlık/aydınlık mod
7. Çıkış → login graffiti (mavi flaş yok)
8. Uçak modu
9. Hesap sil

---

## P. Kod incelemesi (Bugbot / security)

- Auth token sızıntısı
- Hesap silme anonimleştirme
- Offline/error mesajları
- Guest mode auth bypass
- İzin metinleri

---

## Q. Ek testler

| # | Konu |
|---|------|
| Q1 | Erişilebilirlik (font, TalkBack) |
| Q2 | Düşük RAM |
| Q3 | Farklı ekran boyutu |
| Q4 | TR/EN dil |
| Q5 | Deep link / QR |
| Q6 | WebSocket mesaj (offline toggle) |
| Q7 | Bireysel ↔ işletme rolü |
| Q8 | QR ekran görüntüsü |
| Q9 | JWT süresi dolması |
| Q10 | GDPR export dosyası |

---

## Hızlı skor kartı

| Alan | Geçti | Kaldı | Bloker |
|------|-------|-------|--------|
| Ağ / offline | | | |
| Kilit / performans | | | |
| Tema | | | |
| Klavye | | | |
| Navigasyon | | | |
| Guest mode | | | |
| Hesap silme | | | |
| İzinler | | | |
| Hatalar | | | |
| Bildirimler | | | |
| Ödeme metinleri | | | |

**Store minimum:** B1, C1, D1–D3, E (kritik formlar), F2, G1–G3, H1–H2, J3, M2–M3, K1
