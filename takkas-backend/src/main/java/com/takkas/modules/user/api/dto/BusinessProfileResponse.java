package com.takkas.modules.user.api.dto;

import com.takkas.modules.user.domain.enums.BusinessCategory;
import com.takkas.modules.user.domain.enums.BusinessVerificationStatus;
import java.util.UUID;

public record BusinessProfileResponse(
    UUID id,
    String businessName,
    BusinessCategory category,
    String city,
    String district,
    String openAddress,
    String phone,
    String logoUrl,
    String bio,
    boolean verified,
    BusinessVerificationStatus verificationStatus,
    String verificationDocumentUrl,
    String verificationDocumentName,
    boolean phoneVerified
) {}
