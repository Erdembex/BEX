package com.takkas.modules.coupon;

import com.takkas.common.exception.*;
import com.takkas.modules.coupon.domain.Coupon;
import com.takkas.modules.coupon.domain.enums.CouponStatus;
import com.takkas.modules.coupon.repository.CouponRepository;
import com.takkas.modules.listing.domain.enums.RewardType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CouponFacade {

    private static final List<CouponStatus> SWAP_ELIGIBLE = List.of(
        CouponStatus.ACTIVE, CouponStatus.LOCKED_FOR_SWAP);

    private final CouponRepository couponRepository;

    public CouponInfo getCouponForSwap(UUID couponId, UUID ownerId) {
        var c = couponRepository.findByIdAndOwnerIdAndStatusIn(couponId, ownerId, SWAP_ELIGIBLE)
            .orElseThrow(() -> new BusinessRuleException("Kupon bulunamadı, aktif değil veya size ait değil."));
        return toInfo(c);
    }

    public CouponInfo getActiveCouponForSwap(UUID couponId, UUID ownerId) {
        var c = couponRepository.findByIdAndOwnerIdAndStatus(couponId, ownerId, CouponStatus.ACTIVE)
            .orElseThrow(() -> new BusinessRuleException("Kupon bulunamadı, aktif değil veya size ait değil."));
        return toInfo(c);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void lockForSwap(UUID couponId, UUID ownerId) {
        var c = couponRepository.findByIdAndOwnerIdAndStatus(couponId, ownerId, CouponStatus.ACTIVE)
            .orElseThrow(() -> new BusinessRuleException("Kupon bulunamadı, aktif değil veya size ait değil."));
        c.lockForSwap();
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void unlockFromSwap(UUID couponId) {
        couponRepository.findById(couponId).ifPresent(c -> {
            if (c.getStatus() == CouponStatus.LOCKED_FOR_SWAP) {
                c.unlockFromSwap();
            }
        });
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void markAsSwapped(UUID couponId, UUID newOwnerId) {
        var c = couponRepository.findById(couponId)
            .orElseThrow(() -> new ResourceNotFoundException("Kupon bulunamadı."));
        c.markSwapped(newOwnerId);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public UUID issueSwapCoupon(UUID sourceCouponId, UUID newOwnerId) {
        var src = couponRepository.findById(sourceCouponId)
            .orElseThrow(() -> new ResourceNotFoundException("Kupon bulunamadı."));
        int remainingDays = (int) Math.max(
            1, ChronoUnit.DAYS.between(Instant.now(), src.getExpiresAt()));
        var fresh = Coupon.builder()
            .applicationId(null)
            .ownerId(newOwnerId)
            .businessId(src.getBusinessId())
            .rewardType(src.getRewardType())
            .quantity(src.getQuantity())
            .unit(src.getUnit())
            .description(src.getDescription())
            .validityDays(remainingDays)
            .status(CouponStatus.DRAFT)
            .build();
        fresh.activate();
        couponRepository.save(fresh);
        return fresh.getId();
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void archiveSwapped(UUID couponId) {
        var c = couponRepository.findById(couponId)
            .orElseThrow(() -> new ResourceNotFoundException("Kupon bulunamadı."));
        c.archiveSwapped();
    }

    public boolean isCouponAvailableForSwap(UUID couponId, UUID ownerId) {
        return couponRepository.findByIdAndOwnerIdAndStatus(couponId, ownerId, CouponStatus.ACTIVE).isPresent();
    }

    private static CouponInfo toInfo(Coupon c) {
        return new CouponInfo(c.getId(), c.getOwnerId(), c.getRewardType(),
            c.getQuantity(), c.getUnit(), c.getDescription(), c.getExpiresAt());
    }

    public record CouponInfo(UUID id, UUID ownerId, RewardType rewardType,
                              Integer quantity, String unit, String description, Instant expiresAt) {}
}
