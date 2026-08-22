package com.takkas.modules.swap.service;

import com.takkas.common.event.*;
import com.takkas.common.exception.*;
import com.takkas.modules.coupon.CouponFacade;
import com.takkas.modules.swap.api.dto.*;
import com.takkas.modules.swap.domain.SwapOffer;
import com.takkas.modules.swap.domain.SwapOfferMessage;
import com.takkas.modules.swap.domain.enums.SwapOfferStatus;
import com.takkas.modules.swap.mapper.SwapMapper;
import com.takkas.modules.swap.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class SwapOfferService {

    private final SwapListingRepository swapListingRepository;
    private final SwapOfferRepository swapOfferRepository;
    private final SwapOfferMessageRepository swapOfferMessageRepository;
    private final CouponFacade couponFacade;
    private final DomainEventPublisher eventPublisher;

    public SwapOfferResponse sendOffer(UUID offererId, UUID swapListingId, CreateSwapOfferRequest req) {
        var listing = swapListingRepository.findById(swapListingId)
            .orElseThrow(() -> new ResourceNotFoundException("Takas ilanı bulunamadı."));
        if (!listing.isOpen()) throw new BusinessRuleException("Bu takas ilanı artık aktif değil.");
        if (listing.isOwnedBy(offererId)) throw new BusinessRuleException("Kendi takas ilanınıza teklif yapamazsınız.");
        if (swapOfferRepository.existsBySwapListingIdAndOffererId(swapListingId, offererId))
            throw new BusinessRuleException("Bu ilana zaten teklif gönderdiniz.");
        var coupon = couponFacade.getActiveCouponForSwap(req.offeredCouponId(), offererId);
        if (swapOfferRepository.existsByOfferedCouponIdAndStatus(req.offeredCouponId(), SwapOfferStatus.PENDING))
            throw new BusinessRuleException("Bu kupon başka bir bekleyen teklifte kullanılıyor.");
        var saved = swapOfferRepository.save(SwapOffer.builder()
            .swapListing(listing).offererId(offererId)
            .offeredCouponId(req.offeredCouponId()).message(req.message()).build());
        if (req.message() != null && !req.message().isBlank()) {
            swapOfferMessageRepository.save(SwapOfferMessage.builder()
                .swapOfferId(saved.getId())
                .senderId(offererId)
                .body(req.message().trim())
                .build());
        }
        couponFacade.lockForSwap(req.offeredCouponId(), offererId);
        eventPublisher.publish(new SwapOfferReceivedEvent(
            saved.getId(), swapListingId, listing.getOwnerId(), offererId));
        return SwapMapper.toOfferResponse(saved, coupon);
    }

    public void rejectOffer(UUID ownerId, UUID swapListingId, UUID swapOfferId) {
        var listing = swapListingRepository.findById(swapListingId)
            .orElseThrow(() -> new ResourceNotFoundException("Takas ilanı bulunamadı."));
        if (!listing.isOwnedBy(ownerId)) throw new ForbiddenException("Erişim yetkiniz yok.");
        var offer = swapOfferRepository.findById(swapOfferId)
            .orElseThrow(() -> new ResourceNotFoundException("Teklif bulunamadı."));
        offer.reject();
        couponFacade.unlockFromSwap(offer.getOfferedCouponId());
        eventPublisher.publish(new SwapOfferRejectedEvent(swapOfferId, swapListingId, offer.getOffererId()));
    }

    @Transactional(readOnly = true)
    public List<SwapOfferResponse> getOffersForListing(UUID ownerId, UUID swapListingId) {
        var listing = swapListingRepository.findById(swapListingId)
            .orElseThrow(() -> new ResourceNotFoundException("Takas ilanı bulunamadı."));
        if (!listing.isOwnedBy(ownerId)) throw new ForbiddenException("Erişim yetkiniz yok.");
        return swapOfferRepository.findAllBySwapListingIdOrderByCreatedAtDesc(swapListingId)
            .stream().map(o -> SwapMapper.toOfferResponse(o, null)).toList();
    }

    @Transactional(readOnly = true)
    public List<SwapOfferResponse> getMyOffers(UUID offererId) {
        return swapOfferRepository.findAllByOffererIdOrderByCreatedAtDesc(offererId)
            .stream().map(o -> SwapMapper.toOfferResponse(o, null)).toList();
    }
}
