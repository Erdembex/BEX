package com.takkas.common.config;

import com.takkas.modules.application.domain.Application;
import com.takkas.modules.application.domain.enums.ApplicationStatus;
import com.takkas.modules.application.repository.ApplicationRepository;
import com.takkas.modules.coupon.domain.Coupon;
import com.takkas.modules.coupon.repository.CouponRepository;
import com.takkas.modules.listing.domain.Listing;
import com.takkas.modules.listing.domain.ListingReward;
import com.takkas.modules.listing.domain.enums.ListingStatus;
import com.takkas.modules.listing.domain.enums.RewardType;
import com.takkas.modules.listing.domain.enums.WeeklyHours;
import com.takkas.modules.listing.repository.ListingRepository;
import com.takkas.modules.messaging.domain.Conversation;
import com.takkas.modules.messaging.domain.Message;
import com.takkas.modules.messaging.domain.Offer;
import com.takkas.modules.messaging.domain.enums.MessageType;
import com.takkas.modules.messaging.domain.enums.OfferStatus;
import com.takkas.modules.messaging.repository.ConversationRepository;
import com.takkas.modules.messaging.repository.MessageRepository;
import com.takkas.modules.messaging.repository.OfferRepository;
import com.takkas.modules.swap.domain.SwapListing;
import com.takkas.modules.swap.repository.SwapListingRepository;
import com.takkas.modules.user.domain.BusinessProfile;
import com.takkas.modules.user.domain.IndividualProfile;
import com.takkas.modules.user.domain.IndividualSkill;
import com.takkas.modules.user.domain.User;
import com.takkas.modules.user.domain.enums.BusinessCategory;
import com.takkas.modules.user.domain.enums.BusinessVerificationStatus;
import com.takkas.modules.user.domain.enums.Skill;
import com.takkas.modules.user.domain.enums.UserStatus;
import com.takkas.modules.user.domain.enums.UserType;
import com.takkas.modules.user.repository.BusinessProfileRepository;
import com.takkas.modules.user.repository.IndividualProfileRepository;
import com.takkas.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

/**
 * Sunum ve saha demosu icin sabit ornek veri. Yalnizca app.demo.seed-enabled=true
 * oldugunda calisir; production ortaminda kapali kalmalidir.
 *
 * Uretilen veri e-posta adresinden tanınır (DEMO_EMAIL_SUFFIX), boylece gercek
 * kullanicilardan ayirt edilebilir ve tekrar tekrar calistirildiginda cogalmaz.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(3)
public class DemoDataSeeder implements ApplicationRunner {

    private static final String DEMO_EMAIL_SUFFIX = "@demo.passla.com.tr";

    private final UserRepository userRepository;
    private final BusinessProfileRepository businessRepository;
    private final IndividualProfileRepository individualRepository;
    private final ListingRepository listingRepository;
    private final ApplicationRepository applicationRepository;
    private final CouponRepository couponRepository;
    private final SwapListingRepository swapListingRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final OfferRepository offerRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.demo.seed-enabled:false}")
    private boolean seedEnabled;

    @Value("${app.demo.password:PasslaDemo1!}")
    private String demoPassword;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!seedEnabled) return;

        if (userRepository.findByEmail("salon" + DEMO_EMAIL_SUFFIX).isPresent()) {
            log.info("[DemoDataSeeder] Demo verisi zaten mevcut, atlandi.");
            return;
        }

        IndividualProfile ayse = createIndividual(
            "ayse", "Ayşe Demir", "demo_ayse",
            "Grafik tasarım ve sosyal medya içeriği üretiyorum. Portfolyomu görevlerle büyütüyorum.",
            List.of(Skill.GRAPHIC_DESIGN, Skill.SOCIAL_MEDIA, Skill.PHOTOGRAPHY));

        IndividualProfile mert = createIndividual(
            "mert", "Mert Kaya", "demo_mert",
            "Bilgisayar mühendisliği öğrencisiyim. Web sitesi ve SEO işleri yapıyorum.",
            List.of(Skill.WEB_DESIGN, Skill.SEO, Skill.WRITING));

        BusinessProfile salon = createBusiness(
            "salon", "Passla Demo Spor Salonu", BusinessCategory.GYM,
            "Sultanbeyli", "Turgut Reis Mah. Spor Cad. No 14",
            40.9600, 29.2670,
            "Mahalle ölçeğinde bir spor salonu. Dijital tanıtım ihtiyacımızı görev karşılığı çözüyoruz.");

        BusinessProfile kafe = createBusiness(
            "kafe", "Passla Demo Kahve Evi", BusinessCategory.CAFE,
            "Sultanbeyli", "Mecidiye Mah. Pak Sok. No 6",
            40.9615, 29.2705,
            "Üçüncü nesil kahveci. Sosyal medya ve fotoğraf desteği arıyoruz.");

        BusinessProfile kuafor = createBusiness(
            "kuafor", "Passla Demo Kuaför", BusinessCategory.BEAUTY,
            "Sultanbeyli", "Abdurrahmangazi Mah. Güzellik Cad. No 3",
            40.9588, 29.2742,
            "Kadın-erkek kuaför salonu. Randevu sistemi ve tanıtım videosu istiyoruz.");

        // Spor salonu: web sitesi görevi (sunumdaki ana senaryo) + tanıtım videosu
        Listing salonWeb = createListing(salon,
            "Spor salonumuz için modern web sitesi tasarla",
            """
            Salonumuz için mobil uyumlu, üyelik formu içeren tek sayfalık bir web sitesi istiyoruz. \
            Ders programı, iletişim bilgileri ve galeri bölümü olmalı. Alan adı ve barındırma bizde. \
            Tasarımı beraber netleştirebiliriz.
            """,
            WeeklyHours.H5_10, List.of(Skill.WEB_DESIGN, Skill.GRAPHIC_DESIGN),
            RewardType.GYM_MEMBERSHIP, 3, "ay", 180,
            "3 aylık sınırsız salon üyeliği + haftalık protein smoothie");

        createListing(salon,
            "Salon tanıtım videosu çek ve kurgula",
            """
            Antrenman anlarından 30-45 saniyelik dikey tanıtım videosu istiyoruz. \
            Reels ve TikTok formatında, altyazılı teslim edilmeli.
            """,
            WeeklyHours.H3_5, List.of(Skill.VIDEO, Skill.PHOTOGRAPHY),
            RewardType.GYM_MEMBERSHIP, 1, "ay", 120,
            "1 aylık salon üyeliği + 1 kişisel antrenman seansı");

        // Kafe: sosyal medya + menü fotoğrafı
        Listing kafeSosyal = createListing(kafe,
            "Kahve evimizin Instagram hesabını 1 ay yönet",
            """
            Haftada 3 gönderi ve 5 story planı istiyoruz. İçerik çekimi kafede yapılabilir, \
            kahveler bizden. Basit bir içerik takvimi hazırlanmasını bekliyoruz.
            """,
            WeeklyHours.H3_5, List.of(Skill.SOCIAL_MEDIA, Skill.PHOTOGRAPHY),
            RewardType.COFFEE, 20, "adet", 90,
            "20 adet filtre kahve hakkı (istediğin zaman kullanılabilir)");

        createListing(kafe,
            "Yeni menü için ürün fotoğrafları çek",
            """
            12 üründen oluşan yeni menümüz için doğal ışıkta ürün fotoğrafı istiyoruz. \
            Düzenlenmiş yüksek çözünürlüklü teslim bekliyoruz.
            """,
            WeeklyHours.H1_3, List.of(Skill.PHOTOGRAPHY, Skill.GRAPHIC_DESIGN),
            RewardType.PRODUCT, 1, "paket", 90,
            "250 gr çekirdek kahve + 10 adet içecek hakkı");

        // Kuaför: randevu sayfası + metin yazarlığı
        createListing(kuafor,
            "Online randevu sayfası kur",
            """
            Müşterilerimizin gün ve saat seçip randevu alabileceği basit bir sayfa istiyoruz. \
            Hazır araçlarla kurulması yeterli, teknik altyapı şart değil.
            """,
            WeeklyHours.H3_5, List.of(Skill.WEB_DESIGN, Skill.SEO),
            RewardType.DISCOUNT, 5, "kullanım", 150,
            "5 kez ücretsiz saç kesimi");

        createListing(kuafor,
            "Salon için tanıtım metinleri yaz",
            """
            Google işletme profili, Instagram biyografisi ve broşür için kısa tanıtım metinleri istiyoruz. \
            Toplam 6-8 kısa metin yeterli.
            """,
            WeeklyHours.H1_3, List.of(Skill.WRITING, Skill.SOCIAL_MEDIA),
            RewardType.DISCOUNT, 2, "kullanım", 120,
            "2 kez ücretsiz saç bakımı");

        // Tamamlanmis akis 1: Mert web sitesini teslim etti, kupon aktif (QR demosu)
        Coupon activeCoupon = completeFlow(salonWeb, salon, mert,
            "Benzer üç projeyi portfolyomda bulabilirsiniz. Tasarımı bir hafta içinde teslim edebilirim.",
            "Site yayında: demo-spor-salonu.passla.com.tr. Mobil ve masaüstü testleri tamam.",
            "Teslim beklediğimizden hızlı geldi, tasarım çok iyi.");

        seedConversation(
            activeCoupon.getApplicationId(),
            salon.getUser().getId(),
            mert.getUser().getId(),
            salonWeb.getId());

        // Tamamlanmis akis 2: Ayse sosyal medya gorevini bitirdi, kupon takas pazarinda
        Coupon swapCoupon = completeFlow(kafeSosyal, kafe, ayse,
            "Kafe içeriklerinde deneyimim var, örnek hesapları paylaşabilirim.",
            "1 aylık içerik takvimi ve 12 gönderi teslim edildi, etkileşim iki katına çıktı.",
            "İçerikler harika oldu, devam etmek isteriz.");

        swapCoupon.lockForSwap();
        couponRepository.save(swapCoupon);

        swapListingRepository.save(SwapListing.builder()
            .ownerId(ayse.getUser().getId())
            .offeredCouponId(swapCoupon.getId())
            .wantedRewardType(RewardType.GYM_MEMBERSHIP)
            .wantedQuantity(1)
            .wantedDescription("Kahve kuponumu spor salonu üyeliğiyle değişmek istiyorum.")
            .expiresAt(Instant.now().plus(30, ChronoUnit.DAYS))
            .build());

        log.info("""
            [DemoDataSeeder] Demo verisi olusturuldu.
              Isletmeler : salon{0}, kafe{0}, kuafor{0}
              Bireyler   : ayse{0}, mert{0}
              Sifre      : {1}
              Aktif kupon: {2}
            """.replace("{0}", DEMO_EMAIL_SUFFIX)
               .replace("{1}", demoPassword)
               .replace("{2}", String.valueOf(activeCoupon.getQrToken())));
    }

    private BusinessProfile createBusiness(String slug, String name, BusinessCategory category,
                                           String district, String address,
                                           double latitude, double longitude, String bio) {
        User user = userRepository.save(User.builder()
            .email(slug + DEMO_EMAIL_SUFFIX)
            .passwordHash(passwordEncoder.encode(demoPassword))
            .userType(UserType.BUSINESS)
            .status(UserStatus.ACTIVE)
            .emailVerified(true)
            .phoneVerified(true)
            .build());

        return businessRepository.save(BusinessProfile.builder()
            .user(user)
            .businessName(name)
            .category(category)
            .city("İstanbul")
            .district(district)
            .openAddress(address)
            .latitude(latitude)
            .longitude(longitude)
            .bio(bio)
            .verified(true)
            .verificationStatus(BusinessVerificationStatus.VERIFIED)
            .build());
    }

    private IndividualProfile createIndividual(String slug, String fullName, String username,
                                               String bio, List<Skill> skills) {
        User user = userRepository.save(User.builder()
            .email(slug + DEMO_EMAIL_SUFFIX)
            .passwordHash(passwordEncoder.encode(demoPassword))
            .userType(UserType.INDIVIDUAL)
            .status(UserStatus.ACTIVE)
            .emailVerified(true)
            .phoneVerified(true)
            .build());

        IndividualProfile profile = IndividualProfile.builder()
            .user(user)
            .fullName(fullName)
            .username(username)
            .city("İstanbul")
            .district("Sultanbeyli")
            .bio(bio)
            .build();

        skills.forEach(skill -> profile.getSkills().add(new IndividualSkill(profile, skill)));
        return individualRepository.save(profile);
    }

    private Listing createListing(BusinessProfile business, String title, String description,
                                  WeeklyHours weeklyHours, List<Skill> skills,
                                  RewardType rewardType, int quantity, String unit,
                                  int validityDays, String rewardDescription) {
        Listing listing = Listing.builder()
            .business(business)
            .title(title)
            .description(description.strip())
            .weeklyHours(weeklyHours)
            .status(ListingStatus.ACTIVE)
            .viewCount(0)
            .expiresAt(Instant.now().plus(45, ChronoUnit.DAYS))
            .build();

        listing.setReward(ListingReward.builder()
            .rewardType(rewardType)
            .quantity(quantity)
            .unit(unit)
            .validityDays(validityDays)
            .description(rewardDescription)
            .build());

        skills.forEach(listing::addSkill);
        return listingRepository.save(listing);
    }

    /** Sohbet + kabul edilmis teklif: demo ve ekran goruntusu icin sabit konusma. */
    private void seedConversation(UUID applicationId, UUID businessUserId,
                                  UUID individualUserId, UUID listingId) {
        Conversation conversation = conversationRepository.findByApplicationId(applicationId)
            .orElseGet(() -> conversationRepository.save(Conversation.builder()
                .applicationId(applicationId)
                .businessUserId(businessUserId)
                .individualUserId(individualUserId)
                .build()));

        messageRepository.save(Message.builder()
            .conversation(conversation)
            .senderId(individualUserId)
            .messageType(MessageType.TEXT)
            .content("Merhaba, web sitesi görevine başvurmak istiyorum. Üç benzer projeyi portfolyomda paylaşabilirim.")
            .build());

        messageRepository.save(Message.builder()
            .conversation(conversation)
            .senderId(businessUserId)
            .messageType(MessageType.TEXT)
            .content("Merhaba Mert, başvurunuzu gördük. 7 günde teslim edebilir misiniz? Ödül 3 aylık üyelik + haftalık smoothie.")
            .build());

        Message offerMessage = messageRepository.save(Message.builder()
            .conversation(conversation)
            .senderId(individualUserId)
            .messageType(MessageType.OFFER)
            .content("3 aylık üyelik + smoothie karşılığında siteyi 7 günde teslim ederim.")
            .build());

        offerRepository.save(Offer.builder()
            .message(offerMessage)
            .listingId(listingId)
            .resultApplicationId(applicationId)
            .rewardType(RewardType.GYM_MEMBERSHIP)
            .quantity(3)
            .unit("ay")
            .validityDays(180)
            .note("3 aylık sınırsız salon üyeliği + haftalık protein smoothie")
            .status(OfferStatus.ACCEPTED)
            .build());

        messageRepository.save(Message.builder()
            .conversation(conversation)
            .senderId(businessUserId)
            .messageType(MessageType.TEXT)
            .content("Teklifi kabul ettik. Teslimi uygulamadan yükleyebilirsiniz.")
            .build());
    }

    /**
     * Basvuru -> kabul -> teslim -> onay akisini uygular ve odul kuponunu aktif eder.
     */
    private Coupon completeFlow(Listing listing, BusinessProfile business, IndividualProfile individual,
                                String coverLetter, String submissionText, String reviewNote) {
        Application application = applicationRepository.save(Application.builder()
            .listingId(listing.getId())
            .businessId(business.getId())
            .individual(individual)
            .coverLetter(coverLetter)
            .status(ApplicationStatus.PENDING)
            .build());

        application.accept();
        application.submitWork(submissionText, List.of(),
            List.of(), List.of("https://demo.passla.com.tr/teslim/" + application.getId()));
        application.approveSubmission(reviewNote);
        application.setStatus(ApplicationStatus.REWARDED);
        applicationRepository.save(application);

        ListingReward reward = listing.getReward();
        Coupon coupon = Coupon.builder()
            .applicationId(application.getId())
            .ownerId(individual.getUser().getId())
            .businessId(business.getId())
            .rewardType(reward.getRewardType())
            .quantity(reward.getQuantity())
            .unit(reward.getUnit())
            .description(reward.getDescription())
            .validityDays(reward.getValidityDays())
            .build();

        coupon.activate();
        return couponRepository.save(coupon);
    }

    /** Test ve arac kodlarinin demo kullanicilarini ayirt etmesi icin. */
    public static boolean isDemoEmail(String email) {
        return email != null && email.endsWith(DEMO_EMAIL_SUFFIX);
    }

    /** Demo isletmelerin id listesini doner (rapor ve temizlik islerinde kullanilir). */
    public List<UUID> demoBusinessIds() {
        return businessRepository.findAll().stream()
            .filter(b -> b.getUser() != null && isDemoEmail(b.getUser().getEmail()))
            .map(BusinessProfile::getId)
            .toList();
    }
}
