package com.takkas.modules.user.api.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** KVKK m.11 kapsamındaki veri taşınabilirliği çıktısı. */
public record AccountExportResponse(
    Instant exportedAt,
    Account account,
    IndividualProfile individualProfile,
    BusinessProfile businessProfile,
    List<Coupon> coupons,
    List<Listing> listings
) {
    public record Account(
        String id,
        String email,
        String userType,
        String status,
        String phone,
        boolean emailVerified,
        boolean phoneVerified,
        LocalDate birthDate,
        String gender,
        Instant createdAt
    ) {}

    public record IndividualProfile(
        String fullName,
        String username,
        String city,
        String district,
        String bio,
        String avatarUrl,
        String cvUrl,
        List<String> skills,
        Instant createdAt
    ) {}

    public record BusinessProfile(
        String businessName,
        String category,
        String city,
        String district,
        String openAddress,
        Double latitude,
        Double longitude,
        String phone,
        String bio,
        String logoUrl,
        boolean verified,
        String verificationStatus,
        Instant createdAt
    ) {}

    public record Coupon(
        String id,
        String rewardType,
        Integer quantity,
        String unit,
        String description,
        String status,
        Instant issuedAt,
        Instant expiresAt,
        Instant usedAt,
        Instant createdAt
    ) {}

    public record Listing(
        String id,
        String title,
        String description,
        String status,
        String visibility,
        Integer viewCount,
        Instant createdAt,
        Instant expiresAt
    ) {}
}
