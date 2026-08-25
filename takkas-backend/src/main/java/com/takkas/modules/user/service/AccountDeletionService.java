package com.takkas.modules.user.service;

import com.takkas.common.exception.BusinessRuleException;
import com.takkas.common.exception.ResourceNotFoundException;
import com.takkas.common.logging.LogMask;
import com.takkas.infrastructure.push.FcmTokenRepository;
import com.takkas.modules.auth.repository.RefreshTokenRepository;
import com.takkas.modules.listing.domain.Listing;
import com.takkas.modules.listing.domain.enums.ListingStatus;
import com.takkas.modules.listing.repository.ListingRepository;
import com.takkas.modules.user.api.dto.DeleteAccountRequest;
import com.takkas.modules.user.domain.BusinessProfile;
import com.takkas.modules.user.domain.IndividualProfile;
import com.takkas.modules.user.domain.User;
import com.takkas.modules.user.domain.enums.UserStatus;
import com.takkas.modules.user.repository.BusinessProfileRepository;
import com.takkas.modules.user.repository.IndividualProfileRepository;
import com.takkas.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

/**
 * KVKK kapsamında hesap silme.
 *
 * Kayıtlar fiziksel olarak silinmez, kimliksizleştirilir: kupon, başvuru,
 * şikayet ve takas kayıtları karşı tarafın da geçmişi olduğu için ve yasal
 * saklama yükümlülüğü nedeniyle korunur, ancak bu kayıtların işaret ettiği
 * profilde kişisel veri bırakılmaz. Oturumlar ve bildirim kayıtları anında
 * geçersiz kılınır.
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class AccountDeletionService {

    private static final String DELETED_EMAIL_DOMAIN = "@silinmis.passla.invalid";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final IndividualProfileRepository individualProfileRepository;
    private final BusinessProfileRepository businessProfileRepository;
    private final ListingRepository listingRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final FcmTokenRepository fcmTokenRepository;
    private final PasswordEncoder passwordEncoder;

    public void deleteOwnAccount(UUID userId, DeleteAccountRequest req) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı."));

        if (user.getStatus() == UserStatus.DELETED) {
            throw new BusinessRuleException("Bu hesap zaten silinmiş.");
        }
        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new BusinessRuleException("Şifre hatalı. Hesap silinmedi.");
        }

        String shortId = user.getId().toString().substring(0, 8);

        individualProfileRepository.findByUserId(userId)
            .ifPresent(profile -> anonymizeIndividual(profile, shortId));

        businessProfileRepository.findByUserId(userId)
            .ifPresent(profile -> {
                anonymizeBusiness(profile, shortId);
                closeOpenListings(profile.getId());
            });

        anonymizeUser(user, shortId);

        refreshTokenRepository.revokeAllByUserId(userId);
        fcmTokenRepository.deleteByUserId(userId);

        log.info("[AccountDeletion] Hesap silindi: userId={} type={} gerekceVar={}",
            userId, user.getUserType(), req.reason() != null && !req.reason().isBlank());
    }

    private void anonymizeUser(User user, String shortId) {
        log.info("[AccountDeletion] Kimliksizleştiriliyor: email={}", LogMask.email(user.getEmail()));

        user.setEmail("silinmis-" + shortId + DELETED_EMAIL_DOMAIN);
        // Girişi kalıcı olarak imkânsız kılar; şifre sıfırlama da e-posta
        // adresi artık geçersiz olduğu için çalışmaz.
        user.setPasswordHash(passwordEncoder.encode(randomSecret()));
        user.setPhone(null);
        user.setPhoneVerified(false);
        user.setEmailVerified(false);
        user.setBirthDate(null);
        user.setGender(null);
        user.setStatus(UserStatus.DELETED);
        user.setDeletedAt(Instant.now());
        userRepository.save(user);
    }

    private void anonymizeIndividual(IndividualProfile profile, String shortId) {
        profile.setFullName("Silinmiş kullanıcı");
        profile.setUsername("silinmis_" + shortId);
        profile.setAvatarUrl(null);
        profile.setBio(null);
        profile.setCvUrl(null);
        profile.setCity(null);
        profile.setDistrict(null);
        individualProfileRepository.save(profile);
    }

    private void anonymizeBusiness(BusinessProfile profile, String shortId) {
        profile.setBusinessName("Silinmiş işletme " + shortId);
        profile.setOpenAddress(null);
        profile.setLatitude(null);
        profile.setLongitude(null);
        profile.setPhone(null);
        profile.setLogoUrl(null);
        profile.setBio(null);
        profile.setVerificationDocumentUrl(null);
        profile.setVerificationDocumentName(null);
        profile.setVerified(false);
        businessProfileRepository.save(profile);
    }

    /** Silinen işletmenin görevleri açık kalıp başvuru toplamaya devam etmesin. */
    private void closeOpenListings(UUID businessProfileId) {
        for (Listing listing : listingRepository.findAllByBusinessIdOrderByCreatedAtDesc(businessProfileId)) {
            if (listing.getStatus() == ListingStatus.ACTIVE || listing.getStatus() == ListingStatus.DRAFT) {
                listing.setStatus(ListingStatus.CLOSED);
                listingRepository.save(listing);
            }
        }
    }

    private String randomSecret() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
