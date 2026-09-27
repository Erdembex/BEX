# Karar: işletme paketi nasıl satılacak

Tarih: 2026-09-26  
Durum: kapalı test ve ilk Play üretimi için bağlayıcı.

## Karar

**Uygulama içinde paket satma.** İşletme ücreti, şirket kurulunca **web faturası / e-fatura + admin onayı** ile kesilir. Google Play Billing ve Apple IAP bu tura girmez.

Kapalı testte paket **ücretsiz** (mevcut kota: ücretsiz planda en fazla 2 aktif görev). “Planı yükselt” uygulama içi ödeme başlatmaz; destek e-postasına veya `https://passla.com.tr/destek.html` adresine gider.

## Neden bu taraf

- Uygulama içindeki “yükselt” düğmesi dijital hak (daha fazla ilan) satıyorsa Google Play Billing ve App Store IAP zorunlu. O entegrasyon yok; iyzico kapısı kodda placeholder.
- Bugünkü ödeme yolu `manual`: referans kodu ve admin onayı. Bu, mağaza içi kart çekmez.
- Kupon ve mekândaki hizmet fiziksel / işletme hizmeti. İlan hakkı ise dijital. İkisini aynı “uygulama içi satın al” düğmesine bağlamak incelemeyi riske atar.
- Şirket ve e-fatura olmadan kart tahsilatı da erken.

## Ne zaman Play Billing

Aşağıdakilerin hepsi olduktan sonra ayrı proje:

1. Ltd. ve e-fatura
2. En az 10 işletme kapalı testte ilan açmış
3. Fiyat (aylık ilan kotası) net
4. Play Billing + App Store IAP aynı fiyatta

O güne kadar mağaza açıklamasında “uygulama içi satın alma” vaadi yok. `play-store-tr.txt` bunu söylemiyor; yeni metin de söylemesin.

## İncelemede söylenecek cümle

Passla dijital ürün satmaz. İşletme ilanı kapalı testte ücretsizdir. Ücretli plan varsa fatura web üzerinden kesilir; uygulama içi ödeme yoktur.
