package com.takkas.modules.coupon.service;

import com.takkas.common.exception.*;
import com.takkas.modules.application.repository.ApplicationRepository;
import com.takkas.modules.coupon.api.dto.*;
import com.takkas.modules.coupon.domain.Coupon;
import com.takkas.modules.coupon.domain.enums.CouponStatus;
import com.takkas.modules.coupon.mapper.CouponMapper;
import com.takkas.modules.coupon.repository.CouponRepository;
import com.takkas.modules.user.repository.IndividualProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;
    private final ApplicationRepository applicationRepository;
    private final IndividualProfileRepository individualProfileRepository;

    public List<CouponResponse> getMyCoupons(UUID ownerId, CouponStatus status) {
        var coupons = status != null
            ? couponRepository.findAllByOwnerIdAndStatusOrderByCreatedAtDesc(ownerId, status)
            : couponRepository.findAllByOwnerIdOrderByCreatedAtDesc(ownerId);
        return coupons.stream().map(CouponMapper::toResponse).toList();
    }

    public CouponResponse getDetail(UUID couponId, UUID ownerId) {
        var c = couponRepository.findById(couponId)
            .orElseThrow(() -> new ResourceNotFoundException("Kupon bulunamadı."));
        if (!c.getOwnerId().equals(ownerId))
            throw new ForbiddenException("Bu kupona erişim yetkiniz yok.");
        return CouponMapper.toResponse(c);
    }

    public CouponQrResponse getQrCode(UUID couponId, UUID ownerId) {
        var c = couponRepository.findById(couponId)
            .orElseThrow(() -> new ResourceNotFoundException("Kupon bulunamadı."));
        if (!c.getOwnerId().equals(ownerId))
            throw new ForbiddenException("Bu kupona erişim yetkiniz yok.");
        if (c.isLockedForSwap())
            throw new BusinessRuleException(
                "Bu kupon takas pazarında kilitli. QR kodu yalnızca ilanı iptal edince veya takas tamamlanınca kullanılabilir.");
        if (!c.isActive())
            throw new BusinessRuleException("Kupon aktif değil veya süresi dolmuş.");
        return new CouponQrResponse(c.getId(), c.getQrToken(), c.getRewardType(),
            c.getQuantity(), c.getUnit(), c.getDescription(), c.getExpiresAt());
    }

    public CouponResponse getByApplicationForOwner(UUID profileId, UUID applicationId) {
        var application = applicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Başvuru bulunamadı."));
        if (!application.isOwnedBy(profileId)) {
            throw new ForbiddenException("Bu başvuruya erişim yetkiniz yok.");
        }
        var coupon = couponRepository.findByApplicationId(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Bu başvuru için kupon bulunamadı."));
        if (!coupon.getOwnerId().equals(profileId)) {
            throw new ForbiddenException("Bu kupona erişim yetkiniz yok.");
        }
        return CouponMapper.toResponse(coupon);
    }

    public List<CouponResponse> getIssuedCoupons(UUID businessId, CouponStatus status) {
        var coupons = couponRepository.findAllByBusinessIdAndStatus(
            businessId, status != null ? status : CouponStatus.ACTIVE);

        var ownerIds = coupons.stream().map(Coupon::getOwnerId).distinct().toList();
        Map<UUID, String> namesByOwnerId = individualProfileRepository.findFullNamesByIds(ownerIds)
            .stream()
            .collect(Collectors.toMap(
                IndividualProfileRepository.IdAndFullName::getId,
                IndividualProfileRepository.IdAndFullName::getFullName));

        return coupons.stream()
            .map(c -> CouponMapper.toResponse(c, namesByOwnerId.get(c.getOwnerId())))
            .toList();
    }
}
