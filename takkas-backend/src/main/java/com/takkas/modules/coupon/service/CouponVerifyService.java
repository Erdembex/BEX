package com.takkas.modules.coupon.service;

import com.takkas.common.exception.*;
import com.takkas.modules.coupon.api.dto.CouponVerifyResponse;
import com.takkas.modules.coupon.domain.enums.CouponStatus;
import com.takkas.modules.coupon.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class CouponVerifyService {

    private final CouponRepository couponRepository;

    public CouponVerifyResponse verify(String qrToken, UUID businessId) {
        var coupon = couponRepository.findByQrToken(qrToken)
            .orElseThrow(() -> new ResourceNotFoundException("Geçersiz QR kodu."));
        if (!coupon.getBusinessId().equals(businessId)) {
            log.warn("[CouponVerifyService] Yetkisiz doğrulama: token={}", qrToken);
            throw new ForbiddenException("Bu kupon işletmenize ait değil.");
        }
        if (coupon.getStatus() == CouponStatus.LOCKED_FOR_SWAP)
            return new CouponVerifyResponse(CouponVerifyResponse.VerifyResult.LOCKED_FOR_SWAP,
                coupon.getId(), coupon.getRewardType(), coupon.getQuantity(),
                coupon.getUnit(), coupon.getDescription(), null);
        if (coupon.getStatus() == CouponStatus.USED)
            return new CouponVerifyResponse(CouponVerifyResponse.VerifyResult.ALREADY_USED,
                coupon.getId(), coupon.getRewardType(), coupon.getQuantity(),
                coupon.getUnit(), coupon.getDescription(), coupon.getUsedAt());
        if (!coupon.isActive())
            return new CouponVerifyResponse(CouponVerifyResponse.VerifyResult.EXPIRED,
                coupon.getId(), coupon.getRewardType(), coupon.getQuantity(),
                coupon.getUnit(), coupon.getDescription(), null);
        coupon.markUsed();
        return new CouponVerifyResponse(CouponVerifyResponse.VerifyResult.SUCCESS,
            coupon.getId(), coupon.getRewardType(), coupon.getQuantity(),
            coupon.getUnit(), coupon.getDescription(), coupon.getUsedAt());
    }
}
