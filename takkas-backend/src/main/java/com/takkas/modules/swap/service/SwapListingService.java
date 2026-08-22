package com.takkas.modules.swap.service;

import com.takkas.common.exception.*;
import com.takkas.common.pagination.PageResponse;
import com.takkas.modules.coupon.CouponFacade;
import com.takkas.modules.swap.api.dto.*;
import com.takkas.modules.swap.domain.SwapListing;
import com.takkas.modules.swap.domain.enums.*;
import com.takkas.modules.swap.mapper.SwapMapper;
import com.takkas.modules.swap.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class SwapListingService {

    private final SwapListingRepository swapListingRepository;
    private final SwapOfferRepository swapOfferRepository;
    private final CouponFacade couponFacade;

    public SwapListingResponse create(UUID ownerId, CreateSwapListingRequest req) {
        var coupon = couponFacade.getActiveCouponForSwap(req.offeredCouponId(), ownerId);
        if (swapListingRepository.existsByOfferedCouponIdAndStatus(req.offeredCouponId(), SwapListingStatus.OPEN))
            throw new BusinessRuleException("Bu kupon zaten aktif bir takas ilanında kullanılıyor.");
        if (swapOfferRepository.existsByOfferedCouponIdAndStatus(req.offeredCouponId(), SwapOfferStatus.PENDING))
            throw new BusinessRuleException("Bu kupon bekleyen bir takas teklifinde kullanılıyor.");
        var saved = swapListingRepository.save(SwapListing.builder()
            .ownerId(ownerId).offeredCouponId(req.offeredCouponId())
            .wantedRewardType(req.wantedRewardType()).wantedQuantity(req.wantedQuantity())
            .wantedDescription(req.wantedDescription()).expiresAt(req.expiresAt()).build());
        couponFacade.lockForSwap(req.offeredCouponId(), ownerId);
        return SwapMapper.toListingResponse(saved, coupon);
    }

    public void cancel(UUID ownerId, UUID swapListingId) {
        var listing = findOwned(swapListingId, ownerId);
        listing.cancel();
        couponFacade.unlockFromSwap(listing.getOfferedCouponId());
        swapOfferRepository.findAllBySwapListingIdAndStatus(swapListingId, SwapOfferStatus.PENDING)
            .forEach(offer -> {
                offer.reject();
                couponFacade.unlockFromSwap(offer.getOfferedCouponId());
            });
    }

    @Transactional(readOnly = true)
    public PageResponse<SwapListingCardResponse> discover(UUID requesterId, SwapDiscoverRequest req) {
        Instant cursor = req.cursor() != null ? req.cursor() : Instant.now().plusSeconds(1);
        var pageable = PageRequest.of(0, req.pageSize());
        var listings = req.wantedRewardType() == null
            ? swapListingRepository.findOpenForDiscover(requesterId, cursor, pageable)
            : swapListingRepository.findOpenForDiscoverByRewardType(
                req.wantedRewardType(), requesterId, cursor, pageable);
        var cards = listings.stream().map(l -> {
            try {
                var c = couponFacade.getCouponForSwap(l.getOfferedCouponId(), l.getOwnerId());
                return SwapMapper.toCardResponse(l, c);
            } catch (Exception e) { return SwapMapper.toCardResponse(l, null); }
        }).toList();
        return PageResponse.of(cards, listings.isEmpty() ? null : listings.getLast().getCreatedAt());
    }

    @Transactional(readOnly = true)
    public List<SwapListingResponse> getMyListings(UUID ownerId) {
        return swapListingRepository.findAllByOwnerIdOrderByCreatedAtDesc(ownerId)
            .stream().map(l -> SwapMapper.toListingResponse(l, null)).toList();
    }

    private SwapListing findOwned(UUID listingId, UUID ownerId) {
        var l = swapListingRepository.findById(listingId)
            .orElseThrow(() -> new ResourceNotFoundException("Takas ilanı bulunamadı."));
        if (!l.isOwnedBy(ownerId)) throw new ForbiddenException("Bu takas ilanına erişim yetkiniz yok.");
        return l;
    }
}
