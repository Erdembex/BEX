package com.takkas.infrastructure.push;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Expo Go ve Expo push token'ları için bildirim gönderimi.
 * Token formatı: ExponentPushToken[...]
 */
@Service
@Slf4j
public class ExpoPushService {

    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    private final RestClient restClient;

    @Value("${app.expo.access-token:}")
    private String expoAccessToken;

    public ExpoPushService() {
        this.restClient = RestClient.builder().build();
    }

    public boolean isExpoToken(String token) {
        return token != null && token.startsWith("ExponentPushToken");
    }

    @Async("pushNotificationExecutor")
    public void sendToTokens(List<String> tokens, String title, String body, Map<String, String> data) {
        if (tokens == null || tokens.isEmpty()) return;

        List<Map<String, Object>> messages = new ArrayList<>();
        for (String token : tokens) {
            if (!isExpoToken(token)) continue;
            Map<String, Object> message = new java.util.HashMap<>();
            message.put("to", token);
            message.put("title", title);
            message.put("body", body);
            message.put("data", data != null ? data : Map.of());
            message.put("sound", "default");
            message.put("priority", "high");
            message.put("channelId", "default");
            messages.add(message);
        }

        if (messages.isEmpty()) return;

        try {
            var request = restClient.post()
                .uri(EXPO_PUSH_URL)
                .contentType(MediaType.APPLICATION_JSON);

            if (expoAccessToken != null && !expoAccessToken.isBlank()) {
                request = request.header("Authorization", "Bearer " + expoAccessToken);
            }

            request.body(messages).retrieve().toBodilessEntity();
            log.debug("[ExpoPushService] {} push gönderildi", messages.size());
        } catch (Exception ex) {
            log.warn("[ExpoPushService] Gönderim hatası: {}", ex.getMessage());
        }
    }
}
