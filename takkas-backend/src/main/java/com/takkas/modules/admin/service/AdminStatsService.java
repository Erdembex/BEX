package com.takkas.modules.admin.service;

import com.takkas.modules.admin.api.dto.AdminPlatformStatsResponse;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Platform geneli sayımlar. Sorgular JPQL ile doğrudan yürütülür; her metrik için
 * repository'ye ayrı count metodu eklemek yerine tek yerde toplanır.
 */
@Service
@RequiredArgsConstructor
public class AdminStatsService {

    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public AdminPlatformStatsResponse getPlatformStats() {
        Instant now = Instant.now();
        Instant sevenDaysAgo = now.minus(7, ChronoUnit.DAYS);
        Instant thirtyDaysAgo = now.minus(30, ChronoUnit.DAYS);

        return new AdminPlatformStatsResponse(
            now,
            collectUsers(sevenDaysAgo, thirtyDaysAgo),
            collectListings(),
            collectApplications(),
            collectCoupons(),
            collectSwaps(),
            collectEngagement(),
            collectPlanBreakdown()
        );
    }

    private AdminPlatformStatsResponse.Users collectUsers(Instant sevenDaysAgo, Instant thirtyDaysAgo) {
        long total = count("SELECT COUNT(u) FROM User u WHERE u.status <> com.takkas.modules.user.domain.enums.UserStatus.DELETED");
        long individuals = count("""
            SELECT COUNT(u) FROM User u
            WHERE u.userType = com.takkas.modules.user.domain.enums.UserType.INDIVIDUAL
              AND u.status <> com.takkas.modules.user.domain.enums.UserStatus.DELETED
            """);
        long businesses = count("""
            SELECT COUNT(u) FROM User u
            WHERE u.userType = com.takkas.modules.user.domain.enums.UserType.BUSINESS
              AND u.status <> com.takkas.modules.user.domain.enums.UserStatus.DELETED
            """);
        long verifiedBusinesses = count("SELECT COUNT(b) FROM BusinessProfile b WHERE b.verified = true");

        // Ayrı bir "son giriş" alanı yok; refresh token üretimi oturum açma anını temsil eder.
        long active7 = count("""
            SELECT COUNT(DISTINCT t.user.id) FROM RefreshToken t
            WHERE t.createdAt >= :since
            """, "since", sevenDaysAgo);
        long active30 = count("""
            SELECT COUNT(DISTINCT t.user.id) FROM RefreshToken t
            WHERE t.createdAt >= :since
            """, "since", thirtyDaysAgo);
        long new30 = count("""
            SELECT COUNT(u) FROM User u
            WHERE u.createdAt >= :since
              AND u.status <> com.takkas.modules.user.domain.enums.UserStatus.DELETED
            """, "since", thirtyDaysAgo);

        return new AdminPlatformStatsResponse.Users(
            total, individuals, businesses, verifiedBusinesses, active7, active30, new30);
    }

    private AdminPlatformStatsResponse.Listings collectListings() {
        return new AdminPlatformStatsResponse.Listings(
            count("SELECT COUNT(l) FROM Listing l"),
            countListingsByStatus("ACTIVE"),
            countListingsByStatus("CLOSED"),
            countListingsByStatus("EXPIRED"),
            countListingsByStatus("DRAFT")
        );
    }

    private AdminPlatformStatsResponse.Applications collectApplications() {
        long total = count("SELECT COUNT(a) FROM Application a");
        long accepted = countApplicationsByStatus("ACCEPTED");
        long submitted = countApplicationsByStatus("SUBMITTED");
        long rewarded = countApplicationsByStatus("REWARDED");
        double completionRate = ratio(rewarded, total);
        return new AdminPlatformStatsResponse.Applications(
            total, accepted, submitted, rewarded, completionRate);
    }

    private AdminPlatformStatsResponse.Coupons collectCoupons() {
        long total = count("SELECT COUNT(c) FROM Coupon c");
        long active = countCouponsByStatus("ACTIVE");
        long used = countCouponsByStatus("USED");
        long expired = countCouponsByStatus("EXPIRED");
        long swapped = countCouponsByStatus("SWAPPED");
        return new AdminPlatformStatsResponse.Coupons(
            total, active, used, expired, swapped, ratio(used, total));
    }

    private AdminPlatformStatsResponse.Swaps collectSwaps() {
        return new AdminPlatformStatsResponse.Swaps(
            count("SELECT COUNT(s) FROM SwapListing s"),
            count("SELECT COUNT(o) FROM SwapOffer o"),
            count("SELECT COUNT(t) FROM SwapTrade t")
        );
    }

    private AdminPlatformStatsResponse.Engagement collectEngagement() {
        long conversations = count("SELECT COUNT(c) FROM Conversation c");
        long messages = count("SELECT COUNT(m) FROM Message m");
        long offers = count("SELECT COUNT(o) FROM Offer o");
        long feedbacks = count("SELECT COUNT(f) FROM TaskFeedback f");

        Double average = em.createQuery("SELECT AVG(f.stars) FROM TaskFeedback f", Double.class)
            .getSingleResult();
        double rounded = average == null ? 0d : Math.round(average * 100d) / 100d;

        return new AdminPlatformStatsResponse.Engagement(
            conversations, messages, offers, feedbacks, rounded);
    }

    private List<AdminPlatformStatsResponse.PlanBreakdown> collectPlanBreakdown() {
        List<Object[]> rows = em.createQuery("""
            SELECT p.name, p.displayName,
                   COUNT(s.id),
                   SUM(CASE WHEN s.status = com.takkas.modules.subscription.domain.enums.SubscriptionStatus.ACTIVE
                            THEN 1 ELSE 0 END)
            FROM SubscriptionPlan p
            LEFT JOIN BusinessSubscription s ON s.plan = p
            GROUP BY p.id, p.name, p.displayName, p.priceMonthly
            ORDER BY p.priceMonthly ASC
            """, Object[].class).getResultList();

        return rows.stream()
            .map(row -> new AdminPlatformStatsResponse.PlanBreakdown(
                (String) row[0],
                (String) row[1],
                toLong(row[2]),
                toLong(row[3])))
            .toList();
    }

    private long countListingsByStatus(String status) {
        return count("SELECT COUNT(l) FROM Listing l WHERE l.status = "
            + "com.takkas.modules.listing.domain.enums.ListingStatus." + status);
    }

    private long countApplicationsByStatus(String status) {
        return count("SELECT COUNT(a) FROM Application a WHERE a.status = "
            + "com.takkas.modules.application.domain.enums.ApplicationStatus." + status);
    }

    private long countCouponsByStatus(String status) {
        return count("SELECT COUNT(c) FROM Coupon c WHERE c.status = "
            + "com.takkas.modules.coupon.domain.enums.CouponStatus." + status);
    }

    private long count(String jpql) {
        return em.createQuery(jpql, Long.class).getSingleResult();
    }

    private long count(String jpql, String paramName, Object value) {
        return em.createQuery(jpql, Long.class)
            .setParameter(paramName, value)
            .getSingleResult();
    }

    private static double ratio(long part, long whole) {
        if (whole <= 0) return 0d;
        return Math.round((part * 10000d) / whole) / 100d;
    }

    private static long toLong(Object value) {
        return value instanceof Number number ? number.longValue() : 0L;
    }
}
