package com.takkas.modules.coupon.repository;

import com.takkas.modules.coupon.domain.Coupon;
import com.takkas.modules.coupon.domain.enums.CouponStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CouponRepository extends JpaRepository<Coupon, UUID> {
    List<Coupon> findAllByOwnerIdAndStatusOrderByCreatedAtDesc(UUID ownerId, CouponStatus status);
    List<Coupon> findAllByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
    List<Coupon> findAllByBusinessIdAndStatus(UUID businessId, CouponStatus status);
    List<Coupon> findAllByBusinessIdOrderByCreatedAtDesc(UUID businessId);
    Optional<Coupon> findByQrToken(String qrToken);
    Optional<Coupon> findByApplicationId(UUID applicationId);
    boolean existsByApplicationId(UUID applicationId);
    Optional<Coupon> findByIdAndOwnerIdAndStatus(UUID id, UUID ownerId, CouponStatus status);

    Optional<Coupon> findByIdAndOwnerIdAndStatusIn(UUID id, UUID ownerId, Collection<CouponStatus> statuses);

    @Query("SELECT c FROM Coupon c WHERE c.status = 'ACTIVE' AND c.expiresAt < :now")
    List<Coupon> findExpiredActiveCoupons(@Param("now") Instant now);

    @Query("SELECT c FROM Coupon c WHERE c.status = 'ACTIVE' AND c.expiresAt BETWEEN :now AND :threshold")
    List<Coupon> findExpiringCoupons(@Param("now") Instant now, @Param("threshold") Instant threshold);

    @Query(value = """
        SELECT owner_id, COUNT(*) AS cnt FROM coupons
        WHERE status IN ('ACTIVE', 'USED', 'SWAPPED')
        GROUP BY owner_id ORDER BY cnt DESC LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findTopEarners(@Param("limit") int limit);

    @Query(value = """
        SELECT business_id, COUNT(*) AS cnt FROM coupons
        GROUP BY business_id ORDER BY cnt DESC LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findTopGivers(@Param("limit") int limit);
}
