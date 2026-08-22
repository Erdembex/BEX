package com.takkas.modules.swap.service;

import com.takkas.common.event.*;
import com.takkas.common.exception.*;
import com.takkas.modules.coupon.CouponFacade;
import com.takkas.modules.swap.api.dto.SwapTradeResponse;
import com.takkas.modules.swap.domain.*;
import com.takkas.modules.swap.domain.enums.SwapOfferStatus;
import com.takkas.modules.swap.mapper.SwapMapper;
import com.takkas.modules.swap.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class SwapTradeService {

    private final SwapListingRepository swapListingRepository;
    private final SwapOfferRepository swapOfferRepository;
    private final SwapTradeRepository swapTradeRepository;
    private final CouponFacade couponFacade;
    private final DomainEventPublisher eventPublisher;

    public SwapTradeResponse acceptOffer(UUID ownerId, UUID swapListingId, UUID swapOfferId) {
        var listing = swapListingRepository.findById(swapListingId)
            .orElseThrow(() -> new ResourceNotFoundException("Takas ilanı bulunamadı."));
        if (!listing.isOwnedBy(ownerId)) throw new ForbiddenException("Erişim yetkiniz yok.");
        if (!listing.isOpen()) throw new BusinessRuleException("Bu takas ilanı artık aktif değil.");

        var offer = swapOfferRepository.findById(swapOfferId)
            .orElseThrow(() -> new ResourceNotFoundException("Teklif bulunamadı."));
        if (!offer.isPending()) throw new BusinessRuleException("Bu teklif zaten yanıtlandı.");

        // Kuponların hâlâ aktif olduğunu doğrula
        var initiatorCoupon = couponFacade.getCouponForSwap(listing.getOfferedCouponId(), ownerId);
        var receiverCoupon  = couponFacade.getCouponForSwap(offer.getOfferedCouponId(), offer.getOffererId());

        offer.accept();
        listing.match();

        // Diğer PENDING teklifleri reddet
        swapOfferRepository.findAllBySwapListingIdAndStatus(swapListingId, SwapOfferStatus.PENDING)
            .forEach(pending -> {
                if (!pending.getId().equals(swapOfferId)) {
                    pending.reject();
                    couponFacade.unlockFromSwap(pending.getOfferedCouponId());
                    eventPublisher.publish(new SwapOfferRejectedEvent(
                        pending.getId(), swapListingId, pending.getOffererId()));
                }
            });

        // Yeni sahipler için sıfırdan yeni kuponlar (yeni QR kodu) oluştur:
        //  - İlan sahibinin kuponu -> teklif verene yeni kupon
        //  - Teklif verenin kuponu -> ilan sahibine yeni kupon
        UUID offererNewCouponId = couponFacade.issueSwapCoupon(initiatorCoupon.id(), offer.getOffererId());
        UUID ownerNewCouponId   = couponFacade.issueSwapCoupon(receiverCoupon.id(), ownerId);

        // Eski kuponları imha et (arşivle) — eski QR kodları geçersizleşir
        couponFacade.archiveSwapped(initiatorCoupon.id());
        couponFacade.archiveSwapped(receiverCoupon.id());

        var trade = swapTradeRepository.save(SwapTrade.builder()
            .swapListing(listing).swapOffer(offer)
            .initiatorCouponId(offererNewCouponId)
            .receiverCouponId(ownerNewCouponId)
            .initiatorNewOwnerId(offer.getOffererId())
            .receiverNewOwnerId(ownerId).build());

        eventPublisher.publish(new SwapCompletedEvent(
            trade.getId(), swapListingId, swapOfferId, ownerId, offer.getOffererId()));

        log.info("[SwapTradeService] Takas tamamlandı: tradeId={}", trade.getId());
        return SwapMapper.toTradeResponse(trade);
    }
}
