package com.takkas.modules.user.api.dto;

import com.takkas.modules.user.domain.enums.BusinessCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateBusinessProfileRequest(
    @NotBlank @Size(min = 2, max = 255) String businessName,
    @NotNull BusinessCategory category,
    @NotBlank String city,
    @NotBlank String district,
    @Size(min = 10, max = 500) String openAddress,
    String phone,
    String logoUrl,
    @Size(max = 1000) String bio
) {}
