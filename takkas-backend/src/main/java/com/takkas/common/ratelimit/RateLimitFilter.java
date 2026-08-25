package com.takkas.common.ratelimit;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.List;

/**
 * Kimlik doğrulama uçlarına IP bazlı kota uygular. Bu uçlar oturum
 * gerektirmediği için tek koruma katmanı burasıdır.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private record Rule(String method, String path, int limit, Duration window) {
        boolean matches(HttpServletRequest req) {
            return method.equals(req.getMethod()) && path.equals(req.getServletPath());
        }
    }

    private static final Duration FIVE_MINUTES = Duration.ofMinutes(5);
    private static final Duration ONE_HOUR = Duration.ofHours(1);

    private static final List<Rule> RULES = List.of(
        new Rule("POST", "/api/auth/login", 10, FIVE_MINUTES),
        new Rule("POST", "/api/auth/refresh", 60, FIVE_MINUTES),
        new Rule("POST", "/api/auth/register/business", 5, ONE_HOUR),
        new Rule("POST", "/api/auth/register/individual", 5, ONE_HOUR),
        new Rule("POST", "/api/auth/forgot-password", 5, ONE_HOUR),
        new Rule("POST", "/api/auth/reset-password", 10, ONE_HOUR),
        new Rule("POST", "/api/auth/verify-email", 20, ONE_HOUR),
        new Rule("POST", "/api/auth/resend-verification", 5, ONE_HOUR)
    );

    private final RateLimiter rateLimiter;

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain)
            throws ServletException, IOException {

        Rule rule = findRule(req);
        if (rule == null) {
            chain.doFilter(req, res);
            return;
        }

        String key = "ip:" + clientIp(req) + ":" + rule.path();
        if (rateLimiter.tryConsume(key, rule.limit(), rule.window())) {
            chain.doFilter(req, res);
            return;
        }

        log.warn("[RateLimit] Kota aşıldı: path={} ip={}", rule.path(), clientIp(req));
        res.setStatus(429);
        res.setContentType("application/json;charset=UTF-8");
        res.setHeader("Retry-After", String.valueOf(rule.window().toSeconds()));
        res.getWriter().write(
            "{\"code\":\"RATE_LIMITED\",\"message\":\"Çok fazla deneme yaptın. Lütfen biraz sonra tekrar dene.\"}");
    }

    private Rule findRule(HttpServletRequest req) {
        for (Rule rule : RULES) {
            if (rule.matches(req)) {
                return rule;
            }
        }
        return null;
    }

    /** Nginx arkasında çalıştığı için gerçek istemci IP'si X-Forwarded-For'da gelir. */
    private String clientIp(HttpServletRequest req) {
        String forwarded = req.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(forwarded)) {
            int comma = forwarded.indexOf(',');
            return (comma > 0 ? forwarded.substring(0, comma) : forwarded).trim();
        }
        return req.getRemoteAddr();
    }
}
