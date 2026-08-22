package com.takkas.modules.auth.api.dto;

import com.takkas.modules.user.domain.enums.BusinessCategory;
import jakarta.validation.constraints.*;

public record BusinessRegisterRequest(
    @Email @NotBlank String email,
    @NotBlank @Size(min = 8)
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[A-Z]).{8,}$",
             message = "En az 8 karakter, 1 rakam, 1 büyük harf")
    String password,
    @NotBlank @Size(min = 2, max = 255) String businessName,
    @NotNull BusinessCategory category,
    @NotBlank String city,
    @NotBlank String district,
    @NotBlank @Size(min = 10, max = 500) String openAddress,
    String phone
) {}
