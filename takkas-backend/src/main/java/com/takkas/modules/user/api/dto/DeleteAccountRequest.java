package com.takkas.modules.user.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Hesap silme talebi. Şifre, oturumu çalınmış bir cihazdan hesabın
 * silinmesini engellemek için zorunludur.
 */
public record DeleteAccountRequest(
    @NotBlank String password,
    @Size(max = 500) String reason
) {}
