package com.takkas.modules.coupon.domain;

import com.takkas.common.exception.BusinessRuleException;
import com.takkas.modules.coupon.domain.enums.CouponStatus;
import com.takkas.modules.listing.domain.enums.RewardType;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Entity
@Table(name = "coupons", indexes = {
    @Index(name = "coupons_owner_status_idx", columnList = "owner_id, status"),
    @Index(name = "coupons_qr_token_idx",     columnList = "qr_token"),
    @Index(name = "coupons_business_idx",      columnList = "business_id, status"),
    @Index(name = "coupons_application_idx",   columnList = "application_id")
})
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Coupon {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "application_id", unique = true)
    private UUID applicationId;

    @Column(name = "owner_id",    nullable = false) private UUID ownerId;
    @Column(name = "business_id", nullable = false) private UUID businessId;

    @Enumerated(EnumType.STRING) @Column(nullable = false) private RewardType rewardType;
    @Column(nullable = false) private Integer quantity;
    private String unit;
    @Column(columnDefinition = "TEXT") private String description;
    @Column(name = "qr_token", unique = true) private String qrToken;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CouponStatus status = CouponStatus.DRAFT;

    @Column(nullable = false) private Integer validityDays;
    private Instant issuedAt;
    private Instant expiresAt;
    private Instant usedAt;

    @CreatedDate private Instant createdAt;

    public void activate() {
        if (status != CouponStatus.DRAFT)
            throw new BusinessRuleException("Sadece taslak kuponlar aktifleştirilebilir.");
        status    = CouponStatus.ACTIVE;
        issuedAt  = Instant.now();
        expiresAt = issuedAt.plus(validityDays, ChronoUnit.DAYS);
        qrToken   = UUID.randomUUID().toString();
    }

    public void markUsed() {
        validateActive();
        status = CouponStatus.USED;
        usedAt = Instant.now();
    }

    public void expire() {
        if (status == CouponStatus.ACTIVE) status = CouponStatus.EXPIRED;
    }

    public void markSwapped(UUID newOwnerId) {
        if (status != CouponStatus.ACTIVE)
            throw new BusinessRuleException("Sadece aktif kuponlar takas edilebilir.");
        status  = CouponStatus.SWAPPED;
        ownerId = newOwnerId;
    }

    /**
     * Takas sırasında eski kuponu imha eder (arşivler). Sahip değişmez;
     * yeni kupon karşı taraf için ayrıca oluşturulur. Böylece eski QR kodu
     * geçersiz kalır ve ekran görüntüsüyle tekrar kullanılamaz.
     */
    public void lockForSwap() {
        if (status != CouponStatus.ACTIVE)
            throw new BusinessRuleException("Sadece aktif kuponlar takas pazarına konabilir.");
        status = CouponStatus.LOCKED_FOR_SWAP;
        qrToken = null;
    }

    public void unlockFromSwap() {
        if (status != CouponStatus.LOCKED_FOR_SWAP) return;
        status = CouponStatus.ACTIVE;
        qrToken = UUID.randomUUID().toString();
    }

    public void archiveSwapped() {
        if (status != CouponStatus.ACTIVE && status != CouponStatus.LOCKED_FOR_SWAP)
            throw new BusinessRuleException("Sadece aktif veya takasta kilitli kuponlar imha edilebilir.");
        status = CouponStatus.SWAPPED;
        qrToken = null;
    }

    public boolean isActive() {
        return status == CouponStatus.ACTIVE
            && expiresAt != null
            && Instant.now().isBefore(expiresAt);
    }

    public boolean isLockedForSwap() {
        return status == CouponStatus.LOCKED_FOR_SWAP;
    }

    private void validateActive() {
        if (!isActive()) throw new BusinessRuleException("Kupon aktif değil veya süresi dolmuş.");
    }
}
