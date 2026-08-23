package com.takkas.modules.listing.api.dto;

import com.takkas.modules.listing.domain.enums.*;
import com.takkas.modules.user.domain.enums.Skill;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ListingCardResponse(
    UUID id,
    UUID businessProfileId,
    String businessName,
    String businessLogoUrl,
    String businessCategory,
    String businessCity,
    String businessDistrict,
    String title,
    List<Skill> skills,
    RewardType rewardType,
    Integer rewardQuantity,
    String rewardUnit,
    String rewardDescription,
    ListingStatus status,
    long applicantCount,
    long acceptedApplicantCount,
    Instant createdAt,
    Instant expiresAt,
    boolean businessComplaintListed,
    boolean businessIsDangerous,
    boolean businessVerified,
    Double businessLatitude,
    Double businessLongitude,
    Double businessAverageRating,
    Long businessFeedbackCount) {}
