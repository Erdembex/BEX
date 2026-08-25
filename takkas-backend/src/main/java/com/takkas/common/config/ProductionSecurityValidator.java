package com.takkas.common.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("prod")
@Slf4j
public class ProductionSecurityValidator implements ApplicationRunner {

    private static final String DEFAULT_JWT_SECRET = "change-me-in-production-min-32-chars!!";
    private static final String DEFAULT_ADMIN_PASSWORD = "E123456789y.";
    private static final int MIN_JWT_SECRET_LENGTH = 32;

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.admin.seed-enabled:false}")
    private boolean adminSeedEnabled;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Value("${springdoc.swagger-ui.enabled:false}")
    private boolean swaggerEnabled;

    @Value("${app.ratelimit.enabled:true}")
    private boolean rateLimitEnabled;

    @Override
    public void run(ApplicationArguments args) {
        if (DEFAULT_JWT_SECRET.equals(jwtSecret)) {
            throw new IllegalStateException(
                "Production ortamında JWT_SECRET varsayılan değerde olamaz.");
        }
        if (jwtSecret == null || jwtSecret.length() < MIN_JWT_SECRET_LENGTH) {
            throw new IllegalStateException(
                "Production ortamında JWT_SECRET en az " + MIN_JWT_SECRET_LENGTH + " karakter olmalı.");
        }
        if (adminSeedEnabled && DEFAULT_ADMIN_PASSWORD.equals(adminPassword)) {
            throw new IllegalStateException(
                "Admin seed açıkken ADMIN_PASSWORD varsayılan değerde olamaz.");
        }
        if (!rateLimitEnabled) {
            throw new IllegalStateException(
                "Production ortamında rate limit kapatılamaz (RATE_LIMIT_ENABLED).");
        }
        if (adminSeedEnabled) {
            log.warn("[ProductionSecurityValidator] Admin seed production'da açık — kapatmanız önerilir.");
        }
        if (swaggerEnabled) {
            log.warn("[ProductionSecurityValidator] Swagger production'da açık — kapatmanız önerilir.");
        }
    }
}
