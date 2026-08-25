package com.takkas.common.config;

import com.takkas.modules.messaging.config.JwtHandshakeInterceptor;
import com.takkas.modules.messaging.config.JwtChannelInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.*;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtHandshakeInterceptor jwtHandshakeInterceptor;
    private final JwtChannelInterceptor jwtChannelInterceptor;
    private final AllowedOrigins allowedOrigins;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Mobil istemciler Origin başlığı göndermediği için bu liste
        // yalnızca tarayıcı kaynaklı bağlantıları sınırlar.
        String[] origins = allowedOrigins.patterns().toArray(String[]::new);

        registry.addEndpoint("/ws")
            .addInterceptors(jwtHandshakeInterceptor)
            .setAllowedOriginPatterns(origins)
            .withSockJS();

        // React Native — SockJS olmadan doğrudan WebSocket
        registry.addEndpoint("/ws-native")
            .addInterceptors(jwtHandshakeInterceptor)
            .setAllowedOriginPatterns(origins);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration reg) {
        reg.interceptors(jwtChannelInterceptor);
    }
}
