package com.takkas.modules.user.service;

import com.takkas.common.exception.ResourceNotFoundException;
import com.takkas.modules.coupon.repository.CouponRepository;
import com.takkas.modules.listing.repository.ListingRepository;
import com.takkas.modules.user.api.dto.AccountExportResponse;
import com.takkas.modules.user.domain.IndividualSkill;
import com.takkas.modules.user.domain.User;
import com.takkas.modules.user.repository.BusinessProfileRepository;
import com.takkas.modules.user.repository.IndividualProfileRepository;
import com.takkas.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Kullanıcının kendisine ait verileri makine okunabilir biçimde döndürür. */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class AccountDataExportService {

    private final UserRepository userRepository;
    private final IndividualProfileRepository individualProfileRepository;
    private final BusinessProfileRepository businessProfileRepository;
    private final CouponRepository couponRepository;
    private final ListingRepository listingRepository;

    public AccountExportResponse export(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı."));

        var individual = individualProfileRepository.findByUserId(userId)
            .map(p -> new AccountExportResponse.IndividualProfile(
                p.getFullName(),
                p.getUsername(),
                p.getCity(),
                p.getDistrict(),
                p.getBio(),
                p.getAvatarUrl(),
                p.getCvUrl(),
                p.getSkills().stream().map(IndividualSkill::getSkill).map(Enum::name).toList(),
                p.getCreatedAt()))
            .orElse(null);

        var businessProfile = businessProfileRepository.findByUserId(userId).orElse(null);
        var business = businessProfile == null ? null
            : new AccountExportResponse.BusinessProfile(
                businessProfile.getBusinessName(),
                businessProfile.getCategory() == null ? null : businessProfile.getCategory().name(),
                businessProfile.getCity(),
                businessProfile.getDistrict(),
                businessProfile.getOpenAddress(),
                businessProfile.getLatitude(),
                businessProfile.getLongitude(),
                businessProfile.getPhone(),
                businessProfile.getBio(),
                businessProfile.getLogoUrl(),
                businessProfile.isVerified(),
                businessProfile.getVerificationStatus() == null ? null
                    : businessProfile.getVerificationStatus().name(),
                businessProfile.getCreatedAt());

        // QR token bilinçli olarak dışarıda bırakıldı: indirilen dosya ele
        // geçse kupon kullanılabilir hâle gelirdi.
        List<AccountExportResponse.Coupon> coupons =
            couponRepository.findAllByOwnerIdOrderByCreatedAtDesc(userId).stream()
                .map(c -> new AccountExportResponse.Coupon(
                    c.getId().toString(),
                    c.getRewardType().name(),
                    c.getQuantity(),
                    c.getUnit(),
                    c.getDescription(),
                    c.getStatus().name(),
                    c.getIssuedAt(),
                    c.getExpiresAt(),
                    c.getUsedAt(),
                    c.getCreatedAt()))
                .toList();

        List<AccountExportResponse.Listing> listings = businessProfile == null ? List.of()
            : listingRepository.findAllByBusinessIdOrderByCreatedAtDesc(businessProfile.getId()).stream()
                .map(l -> new AccountExportResponse.Listing(
                    l.getId().toString(),
                    l.getTitle(),
                    l.getDescription(),
                    l.getStatus().name(),
                    l.getVisibility() == null ? null : l.getVisibility().name(),
                    l.getViewCount(),
                    l.getCreatedAt(),
                    l.getExpiresAt()))
                .toList();

        return new AccountExportResponse(
            Instant.now(),
            new AccountExportResponse.Account(
                user.getId().toString(),
                user.getEmail(),
                user.getUserType().name(),
                user.getStatus().name(),
                user.getPhone(),
                user.isEmailVerified(),
                user.isPhoneVerified(),
                user.getBirthDate(),
                user.getGender() == null ? null : user.getGender().name(),
                user.getCreatedAt()),
            individual,
            business,
            coupons,
            listings);
    }
}
