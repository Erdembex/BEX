package com.takkas.modules.auth.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Kayıt sonrası e-posta doğrulama bekleniyor")
public record RegisterPendingResponse(
    String email,
    String message,
    @Schema(description = "Yalnızca yerel geliştirmede — e-posta gitmezse 8 haneli kod")
    String devVerificationCode
) {}
