package com.takkas.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * HTTP CORS ve WebSocket el sıkışması için tek origin listesi.
 * Yerel kalıplar geliştirme içindir; production domainleri
 * CORS_ALLOWED_ORIGINS ile eklenir. Joker (*) hiçbir zaman kabul edilmez.
 */
@Component
public class AllowedOrigins {

    private static final List<String> LOCAL_PATTERNS = List.of(
        "http://localhost:*",
        "https://localhost:*",
        "http://127.0.0.1:*",
        "https://127.0.0.1:*",
        "http://192.168.*.*:*",
        "https://192.168.*.*:*",
        "http://10.*.*.*:*",
        "https://10.*.*.*:*"
    );

    private final List<String> patterns;

    public AllowedOrigins(@Value("${app.cors.allowed-origins:}") String configuredOrigins) {
        List<String> resolved = new ArrayList<>(LOCAL_PATTERNS);
        if (configuredOrigins != null && !configuredOrigins.isBlank()) {
            Arrays.stream(configuredOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank() && !"*".equals(origin))
                .forEach(resolved::add);
        }
        this.patterns = List.copyOf(resolved);
    }

    public List<String> patterns() {
        return patterns;
    }
}
