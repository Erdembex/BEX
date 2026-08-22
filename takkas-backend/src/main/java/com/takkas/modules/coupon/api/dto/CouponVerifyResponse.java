package com.takkas.modules.coupon.api.dto;
import com.takkas.modules.listing.domain.enums.RewardType;
import java.time.Instant;
import java.util.UUID;
public record CouponVerifyResponse(
    VerifyResult result, UUID couponId,
    RewardType rewardType, Integer quantity, String unit,
    String description, Instant usedAt
) {
    public enum VerifyResult { SUCCESS, ALREADY_USED, EXPIRED, LOCKED_FOR_SWAP }
}
