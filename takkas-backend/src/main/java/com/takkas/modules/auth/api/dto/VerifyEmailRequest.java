package com.takkas.modules.auth.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VerifyEmailRequest(
    @NotBlank @Email String email,
    @NotBlank @Size(min = 8, max = 8) String code
) {}
