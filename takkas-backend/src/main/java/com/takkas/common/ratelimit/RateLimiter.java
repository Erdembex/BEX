package com.takkas.common.ratelimit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Bellek içi sabit pencere sayacı. Tek instance dağıtımı için yeterli;
 * Redis'e bağımlı olmadığı için Redis düşse bile giriş akışı kilitlenmez.
 */
@Component
public class RateLimiter {

    @Value("${app.ratelimit.enabled:true}")
    private boolean enabled;

    private static final class Counter {
        final long windowStartMs;
        final AtomicInteger hits = new AtomicInteger();

        Counter(long windowStartMs) {
            this.windowStartMs = windowStartMs;
        }
    }

    private final Map<String, Counter> counters = new ConcurrentHashMap<>();

    /**
     * Sayacı bir artırır.
     *
     * @return istek kota içindeyse true, kota aşıldıysa false
     */
    public boolean tryConsume(String key, int limit, Duration window) {
        if (!enabled) {
            return true;
        }

        long now = System.currentTimeMillis();
        long windowMs = window.toMillis();
        long windowStart = now - (now % windowMs);

        Counter counter = counters.compute(key, (k, existing) ->
            (existing == null || existing.windowStartMs != windowStart)
                ? new Counter(windowStart)
                : existing);

        return counter.hits.incrementAndGet() <= limit;
    }

    /** Başarılı işlemden sonra sayacı sıfırlar (ör. doğru şifre girildiğinde). */
    public void reset(String key) {
        counters.remove(key);
    }

    /** Geçmiş pencerelere ait sayaçlar bellekte birikmesin. */
    @Scheduled(fixedDelay = 600_000L)
    void evictStaleCounters() {
        long cutoff = System.currentTimeMillis() - Duration.ofHours(2).toMillis();
        counters.entrySet().removeIf(e -> e.getValue().windowStartMs < cutoff);
    }
}
