package com.takkas.infrastructure.geocoding;

import com.fasterxml.jackson.databind.JsonNode;
import com.takkas.modules.user.domain.BusinessProfile;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.stream.Stream;

@Service
@Slf4j
public class BusinessGeocodingService {

    private static final Duration TIMEOUT = Duration.ofSeconds(10);
    private static final String USER_AGENT = "Passla/1.0 (https://passla.com.tr)";

    private final WebClient nominatimClient;

    public BusinessGeocodingService(WebClient.Builder webClientBuilder) {
        this.nominatimClient = webClientBuilder
            .baseUrl("https://nominatim.openstreetmap.org")
            .defaultHeader("User-Agent", USER_AGENT)
            .build();
    }

    public void applyGeocode(BusinessProfile profile) {
        if (profile == null) return;
        String city = trim(profile.getCity());
        String district = trim(profile.getDistrict());
        if (city == null || district == null) {
            return;
        }

        String openAddress = trim(profile.getOpenAddress());
        String query = Stream.of(openAddress, district, city, "Türkiye")
            .filter(part -> part != null && !part.isBlank())
            .reduce((a, b) -> a + ", " + b)
            .orElse(null);

        if (query == null) {
            return;
        }

        geocode(query).ifPresent(result -> {
            profile.setLatitude(result.latitude());
            profile.setLongitude(result.longitude());
            log.info("Geocoded business {} -> {}, {}", profile.getId(), result.latitude(), result.longitude());
        });
    }

    public java.util.Optional<GeoPoint> geocode(String query) {
        if (query == null || query.isBlank()) {
            return java.util.Optional.empty();
        }
        try {
            JsonNode body = nominatimClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path("/search")
                    .queryParam("q", query)
                    .queryParam("format", "json")
                    .queryParam("limit", 1)
                    .queryParam("countrycodes", "tr")
                    .build())
                .retrieve()
                .bodyToMono(JsonNode.class)
                .block(TIMEOUT);

            if (body == null || !body.isArray() || body.isEmpty()) {
                return java.util.Optional.empty();
            }

            JsonNode hit = body.get(0);
            if (hit == null || !hit.hasNonNull("lat") || !hit.hasNonNull("lon")) {
                return java.util.Optional.empty();
            }

            double lat = hit.get("lat").asDouble();
            double lng = hit.get("lon").asDouble();
            if (!Double.isFinite(lat) || !Double.isFinite(lng)) {
                return java.util.Optional.empty();
            }
            return java.util.Optional.of(new GeoPoint(lat, lng));
        } catch (Exception ex) {
            log.warn("Geocode failed for query '{}': {}", query, ex.getMessage());
            return java.util.Optional.empty();
        }
    }

    private static String trim(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public record GeoPoint(double latitude, double longitude) {}
}
