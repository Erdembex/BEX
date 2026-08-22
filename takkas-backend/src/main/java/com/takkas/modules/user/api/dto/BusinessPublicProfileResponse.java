package com.takkas.modules.user.api.dto;

import com.takkas.modules.user.domain.enums.BusinessCategory;
import java.util.UUID;

public record BusinessPublicProfileResponse(
    UUID profileId,
    UUID ownerUserId,
    String businessName,
    String logoUrl,
    BusinessCategory category,
    String city,
    String district,
    String openAddress,
    boolean verified,
    boolean complaintListed,
    double averageRating,
    long feedbackCount,
    long completedTaskCount,
    long approvedComplaintCount,
    double complaintRate,
    long activeListingCount,
    boolean isDangerous) {}
