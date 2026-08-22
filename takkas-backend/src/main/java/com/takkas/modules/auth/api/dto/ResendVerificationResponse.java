package com.takkas.modules.auth.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Doğrulama kodu yeniden gönderildi")
public record ResendVerificationResponse(
    @Schema(description = "Yalnızca yerel geliştirmede — e-posta gitmezse 8 haneli kod")
    String devVerificationCode
) {}
