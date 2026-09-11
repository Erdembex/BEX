# Passla Canlı Demo Senaryosu (3 dakika)

Sponsor ve yatırımcı görüşmelerinde telefonda gösterilecek **sabit** akış.
Doğaçlama yapma: her ekran önceden hazırlanmış demo verisiyle çalışır.

---

## Demo öncesi kontrol listesi

Görüşmeden **en az 1 saat önce** yapılacaklar:

```
□ Telefonda güncel APK kurulu
□ İnternet çalışıyor (mobil veri yedek olarak açık)
□ Backend ayakta: https://api.passla.com.tr/actuator/health → UP
□ Demo verisi yüklü (aşağıdaki komut)
□ İki hesap ayrı ayrı giriş yapılmış ve test edilmiş
□ Telefon şarjı %50+, bildirimler kapalı, ekran parlaklığı yüksek
□ Uygulama önceden açılmış (ilk açılış yavaşlığı görüşmede yaşanmasın)
```

### Demo verisini yükle

Backend ortamında:

```bash
DEMO_SEED_ENABLED=true
DEMO_PASSWORD=PasslaDemo1!
```

Uygulama yeniden başlatıldığında `DemoDataSeeder` şunları oluşturur:

- **3 işletme**: Passla Demo Spor Salonu (Sultanbeyli), Passla Demo Kahve Evi, Passla Demo Kuaför
- **6 aktif görev**: web sitesi, tanıtım videosu, Instagram yönetimi, ürün fotoğrafı, randevu sayfası, tanıtım metinleri
- **2 tamamlanmış görev akışı**: başvuru → kabul → teslim → onay → kupon
- **1 aktif kupon** (Mert, 3 aylık salon üyeliği — QR gösterimi için)
- **1 takas ilanı** (Ayşe, kahve kuponunu salon üyeliğiyle değişmek istiyor)

Seeder aynı veriyi ikinci kez üretmez, tekrar başlatmak güvenlidir.

### Demo hesaplar

| Rol | E-posta | Şifre | Demoda ne için |
|-----|---------|-------|----------------|
| Birey — kuponu olan | `mert@demo.passla.com.tr` | `PasslaDemo1!` | Ana akış, QR kupon |
| Birey — takas ilanı olan | `ayse@demo.passla.com.tr` | `PasslaDemo1!` | Takas pazarı |
| İşletme — spor salonu | `salon@demo.passla.com.tr` | `PasslaDemo1!` | İşletme tarafı |
| Yönetici | `admin@bex.dev` (yerel) | `application.yml` içindeki `ADMIN_PASSWORD` | İstatistik: `GET /api/admin/stats` |

---

## Akış (3 dakika)

### 0:00–0:20 — Çerçeveyi kur (telefon henüz kapalı)

> "Size 25.000 TL'lik bir problemi 3 dakikada göstereceğim.
> Bir spor salonu web sitesi yaptırmak istiyor, ajans 25.000 TL istiyor,
> bütçe yok, iş ertelenir. Passla'da o iş nakit çıkmadan yapılıyor."

Telefonu masaya koy, ekranı karşı tarafa çevir. **Onların eline verme** — akışı sen yönet.

### 0:20–0:50 — Kullanıcı tarafı: görevi keşfet

1. `mert@demo.passla.com.tr` ile açılmış uygulama (giriş önceden yapılmış olsun).
2. **Ana hub** ekranını göster — 8 kart.

> "Kullanıcı tarafı bu. Görevler, kuponlar, takas, sohbet — hepsi tek yerde."

3. **Görevler** kartına gir.
4. Arama kutusuna `web` yaz.

> "Beceriye ve konuma göre arama yapıyor. Sultanbeyli'deki spor salonunun görevi geldi."

5. **"Spor salonumuz için modern web sitesi tasarla"** görevini aç.
6. Ödül bölümünü göster: **3 aylık sınırsız salon üyeliği + haftalık smoothie**.

> "Ödül para değil. İşletmenin kendi hizmeti. Nakit çıkışı yok."

### 0:50–1:30 — İşletme tarafı: görev nasıl açılır

1. Çıkış yap, `salon@demo.passla.com.tr` ile gir. *(Alternatif: ikinci telefon hazırla, geçiş süresi kazanırsın.)*
2. **İşletme paneli** → **Görev oluştur**.
3. Alanları göster: başlık, açıklama, aranan beceri, haftalık saat, ödül tipi, geçerlilik süresi.

> "İşletme 2 dakikada görev açıyor. Ödülü kendisi tanımlıyor.
> Başvuranları görüyor, sohbette şartları netleştiriyor."

4. **Başvurular** listesini göster — Mert'in başvurusu ve teslimi görünür.

> "Teslim geldi, işletme onayladı. Onaylandığı anda kupon otomatik üretiliyor."

### 1:30–2:15 — Kupon ve QR doğrulama (en güçlü kısım)

1. `mert@demo.passla.com.tr` hesabına dön.
2. **Cüzdan** / **Kuponlarım** → aktif kupon: 3 aylık salon üyeliği.
3. Kuponu aç, **QR kodu** göster.

> "Kullanıcı salona gidiyor, bu QR'ı gösteriyor.
> İşletme uygulamadan okutuyor, kupon tek kullanımda kapanıyor.
> Ekran görüntüsüyle tekrar kullanılamıyor, çünkü token okutulunca geçersiz oluyor."

Bu, sponsorun en çok güvendiği noktadır: **suistimal edilemez**.

### 2:15–2:45 — Takas pazarı (farklılaşma)

1. `ayse@demo.passla.com.tr` hesabına geç (veya takas sekmesini göster).
2. **Takas** ekranı: Ayşe kahve kuponunu salon üyeliğiyle değişmek istiyor.

> "Kupon ölü sermaye değil. Kullanıcı istemediği ödülü başka bir ödülle değişebiliyor.
> Bu, kupon dolaşım hacmini artırıyor — bizim için ana büyüme göstergesi."

### 2:45–3:00 — Kapanış ve talep

Telefonu bırak, göz teması kur.

**Pilot işletmeye:**

> "Sizden nakit istemiyoruz. 3 ay ücretsiz Standart paket veriyoruz,
> ilk 10 görevinizi öne çıkarıyoruz. Karşılığında haftada bir görev açın
> ve bize dürüst geri bildirim verin. Sizin için riski sıfır."

**Yatırımcıya:**

> "Ürün çalışıyor, altyapı canlı. Şimdi ihtiyacımız olan şey pilot ölçeğini büyütmek.
> Bunun için X TL ve Y ay konuşmak istiyoruz."

---

## Sık gelen sorular ve dürüst cevaplar

**"Kaç kullanıcınız var?"**
> "Henüz mağazada yayında değiliz. Çalışan prototip ve pilot aşamasındayız.
> Gösterdiğim veri demo verisi, bunu açıkça söylüyorum.
> Pilot hedefimiz 50 işletme ve 500 aktif kullanıcı."

Asla uydurma sayı verme. Dürüstlük burada en güçlü kozdur.

**"Para nasıl kazanıyorsunuz?"**
> "İşletme aboneliği. Ücretsiz plan 2 ilan, Standart 299 TL/ay, Pro 699 TL/ay.
> İleride öne çıkan ilan ve takas işlemlerinden düşük oranlı hizmet bedeli."

**"Ödeme altyapısı var mı?"**
> "Pilot döneminde abonelik onayı manuel yürüyor.
> Lansmanda sanal POS entegrasyonu devreye giriyor; altyapı hazır, sağlayıcı seçimi aşamasında."

**"İşletme ödülü vermezse ne olur?"**
> "Kupon sistemde kayıtlı, şikayet mekanizması var, işletme puanı düşüyor.
> KYC doğrulaması yapılan işletmeler ayrıca işaretli."

**"Rakipleriniz kim?"**
> "Bionluk ve Armut nakit üzerinden çalışıyor. Fiverr ve Upwork da öyle.
> Takas odaklı yapılar ise ilan panosu düzeyinde kalıyor.
> Bizim farkımız uçtan uca dijital süreç: başvuru, sohbet, teklif, QR doğrulama, takas."

**"Neden başkası yapmasın?"**
> "Teknik engel değil, operasyon engeli. İşletme ve kullanıcı tarafını
> aynı anda yerelde doldurmak gerekiyor. Biz sahada bunu yapıyoruz."

---

## Demo çökerse ne yapılır

1. **Panik yapma, açıklama yapma.** "Bağlantı" deyip ekran görüntülerine geç.
2. `bex/store-listing/screenshots/` içindeki görüntüler telefonun galerisinde de dursun.
3. Sunumdaki ürün slaytlarını kullanarak anlatımı tamamla.
4. Görüşme sonrası APK linkini gönder: kendisi denesin.

Yedek plan hazır olduğu sürece teknik arıza güven kaybettirmez; hazırlıksızlık kaybettirir.
