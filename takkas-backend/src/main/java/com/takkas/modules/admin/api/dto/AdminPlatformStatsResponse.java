package com.takkas.modules.admin.api.dto;

import java.time.Instant;
import java.util.List;

/**
 * Platform geneli sayısal durum. Pilot dönemi takibi ve sunum materyalleri bu uçtan beslenir.
 */
public record AdminPlatformStatsResponse(
    Instant generatedAt,
    Users users,
    Listings listings,
    Applications applications,
    Coupons coupons,
    Swaps swaps,
    Engagement engagement,
    List<PlanBreakdown> subscriptionPlans
) {

    public record Users(
        long total,
        long individuals,
        long businesses,
        long verifiedBusinesses,
        long activeLast7Days,
        long activeLast30Days,
        long newLast30Days
    ) {}

    public record Listings(
        long total,
        long active,
        long closed,
        long expired,
        long draft
    ) {}

    public record Applications(
        long total,
        long accepted,
        long submitted,
        long rewarded,
        double completionRate
    ) {}

    public record Coupons(
        long total,
        long active,
        long used,
        long expired,
        long swapped,
        double redemptionRate
    ) {}

    public record Swaps(
        long listings,
        long offers,
        long completedTrades
    ) {}

    public record Engagement(
        long conversations,
        long messages,
        long offers,
        long feedbacks,
        double averageRating
    ) {}

    public record PlanBreakdown(
        String planName,
        String displayName,
        long subscriberCount,
        long activeSubscriberCount
    ) {}
}
