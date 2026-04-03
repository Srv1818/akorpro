# Güvenlik Olayı ve Siber Müdahale Prosedürü — AkorPro

Bu belge, beklenmedik güvenlik olaylarında (şüpheli erişim, sızıntı, hesap ele geçirme, DDoS, kötüye kullanım) izlenecek **operasyonel** adımları tanımlar. Veri geri yükleme ve RTO/RPO için bkz. [disaster-recovery.md](./disaster-recovery.md).

**Belge sahibi:** (ad / rol — doldurun)  
**Son gözden geçirme:** (tarih — doldurun)

---

## 1. Tetikleyiciler (prosedürü başlat)

Aşağıdakilerden biri gerçekleştiğinde bu prosedür devreye girer:

- Üretim sırlarının veya `.env` / hosting ortam değişkenlerinin ifşa olduğu şüphesi
- Yetkisiz admin / moderasyon eylemi veya toplu veri değişikliği
- Olağandışı API veya Firestore trafiği; brute-force / otomasyon belirtileri
- Kullanıcı veya düzenleyici raporu: hesap ele geçirme, sahte içerik yayını
- Barındırma / DNS / domain üzerinde izinsiz değişiklik

---

## 2. İlk 15 dakika: sınırla ve netleştir

1. **Olayı kayda geçir:** Tarih-saat, kim fark etti, ilk belirtiler (kısa not).
2. **Kapsamı ayır:** Sadece bir kullanıcı mı, tek bir endpoint mi, yoksa proje geneli mi?
3. **Gerekirse erişimi daralt:**
   - Şüpheli Firebase kullanıcılarının oturumunu sonlandırma (Console → Authentication).
   - Geçici olarak riskli admin işlemlerini veya ilgili API route’larını deployment ile kapatma (ekip kararı).
4. **Panik yapmadan iletişim:** Yalnızca yetkili kişilere bilgi ver; ifşa edilmiş sırları chat veya e-postada tekrar paylaşma.

---

## 3. Sırlar ve kimlik bilgileri rotasyonu

Sızıntı veya şüphe varsa, **etkilenen her sırrı** üretin ve eskisini devre dışı bırakın. Hosting (ör. Vercel) ve yerel `.env.local` aynı anda güncellenmeli.

Uygulamada kullanılan başlıca gizli / hassas yapı taşları (isimler; değer asla dokümante edilmez):

| Tür | Ortam değişkeni / konum | Not |
|-----|-------------------------|-----|
| Sunucu → Firebase Admin | `FIREBASE_SERVICE_ACCOUNT_KEY` | Google Cloud IAM’de eski anahtarı iptal, yenisini oluştur |
| Admin claims API | `ADMIN_CLAIMS_SECRET` | Rastgele güçlü yeni değer |
| On-demand revalidate | `REVALIDATION_SECRET` | Rastgele güçlü yeni değer |
| İstemci (kısıtlı) | `NEXT_PUBLIC_FIREBASE_*` | API key Firebase Console’da kısıtlanır; gerekirse yenilenir |
| İzleme | `SENTRY_AUTH_TOKEN`, org/project | Sentry’de token iptal + yeni |
| Diğer | Barındırıcı, GA, reCAPTCHA vb. | İlgili konsolda rotasyon |

Rotasyon sonrası: yeniden deploy, oturum çerezlerinin geçersiz kalabileceğini göz önünde bulundurun; kullanıcıların yeniden giriş yapması normaldir.

---

## 4. Firebase ve uygulama kontrolleri

Sırayla (duruma göre atlanabilir):

1. **Authentication:** Şüpheli hesapları devre dışı bırak veya sil; gerekirse toplu oturum iptali politikası değerlendirilir.
2. **Firestore:** Güvenlik kuralları son değişiklikleri; anormal okuma/yazma. `admin_audit` ve moderasyon logları.
3. **App Check / reCAPTCHA:** Kötüye kullanım varsa kurallar veya App Check sıkılığı gözden geçirilir.
4. **Storage / diğer ürünler:** Kullanılıyorsa erişim ve kurallar kontrol edilir.

---

## 5. Veri bütünlüğü

- Küçük / hedefli bozulma: ilgili dokümanları Console veya admin araçlarıyla düzelt.
- Toplu veya belirsiz bozulma: [disaster-recovery.md](./disaster-recovery.md) içindeki **PITR** ve geri yükleme adımları.

---

## 6. KVKK ve bildirim

Kişisel veri ihlali söz konusu olabilirse, **KVKK** ve iç politikanız gereği veri sorumlusuna / KB’ye bildirim süreleri ve kullanıcı bilgilendirmesi değerlendirilir. Hukuk veya üst yönetim ile hizalanın; bu belge hukuki tavsiye değildir.

---

## 7. Olay sonrası

1. Kök neden analizi (kısa): nasıl oldu, nasıl tekrarlanmaz?
2. Eksik izleme / alarm varsa ekleme.
3. Bu dosyadaki “Son gözden geçirme” tarihini güncelleme.
4. Yılda en az bir kez **masa başı tatbikat** (senaryo + sıra kontrolü); veri tatbikatı için bkz. disaster-recovery.

---

## 8. Hızlı kontrol listesi (yazdırılabilir)

- [ ] Olay notu (zaman çizelgesi)
- [ ] Etki sınırlandırıldı (auth / deploy / rate limit)
- [ ] Etkilenen tüm sırlar döndürüldü ve deploy edildi
- [ ] Firebase + loglar incelendi
- [ ] Veri düzeltildi veya PITR planlandı
- [ ] KVKK / iç süreç değerlendirildi
- [ ] Kök neden ve belge güncellemesi
