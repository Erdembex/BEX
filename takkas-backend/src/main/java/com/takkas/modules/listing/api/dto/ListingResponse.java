package com.takkas.modules.listing.api.dto;

import com.takkas.modules.listing.domain.enums.*;
import com.takkas.modules.user.domain.enums.Skill;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ListingResponse(
    UUID id, UUID businessId, String businessName, String businessLogoUrl,
    String title, String description, WeeklyHours weeklyHours,
    ListingStatus status, List<Skill> skills,
    RewardType rewardType, Integer rewardQuantity, String rewardUnit,
    Integer validityDays, String rewardDescription,
    int viewCount, Instant createdAt, Instant expiresAt,
    boolean businessVerified,
    Double businessAverageRating,
    Long businessFeedbackCount
) {}
