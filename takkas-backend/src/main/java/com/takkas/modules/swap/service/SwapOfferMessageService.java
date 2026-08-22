package com.takkas.modules.swap.service;

import com.takkas.common.event.DomainEventPublisher;
import com.takkas.common.event.SwapOfferChatMessageEvent;
import com.takkas.common.exception.BusinessRuleException;
import com.takkas.common.exception.ForbiddenException;
import com.takkas.common.exception.ResourceNotFoundException;
import com.takkas.common.security.UserPrincipal;
import com.takkas.modules.swap.api.dto.CreateSwapOfferMessageRequest;
import com.takkas.modules.swap.api.dto.SwapOfferChatContextResponse;
import com.takkas.modules.swap.api.dto.SwapOfferMessageResponse;
import com.takkas.modules.swap.domain.SwapOfferMessage;
import com.takkas.modules.swap.domain.enums.SwapOfferStatus;
import com.takkas.modules.swap.repository.SwapOfferMessageRepository;
import com.takkas.modules.swap.repository.SwapOfferRepository;
import com.takkas.modules.user.UserFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SwapOfferMessageService {

    private final SwapOfferRepository swapOfferRepository;
    private final SwapOfferMessageRepository messageRepository;
    private final UserFacade userFacade;
    private final DomainEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public SwapOfferChatContextResponse getChatContext(UUID offerId, UserPrincipal principal) {
        var offer = findOffer(offerId);
        var listing = offer.getSwapListing();
        ensureParticipant(offer.getOffererId(), listing.getOwnerId(), principal.profileId());

        UUID peerProfileId = principal.profileId().equals(offer.getOffererId())
            ? listing.getOwnerId()
            : offer.getOffererId();
        String peerName = resolveDisplayName(peerProfileId);
        String listingTitle = listing.getWantedDescription();
        if (listingTitle == null || listingTitle.isBlank()) {
            listingTitle = "Takas ilanı";
        }

        return new SwapOfferChatContextResponse(
            offer.getId(),
            listing.getId(),
            listingTitle.trim(),
            peerName,
            offer.getStatus(),
            offer.getMessage());
    }

    @Transactional(readOnly = true)
    public List<SwapOfferMessageResponse> listMessages(UUID offerId, UserPrincipal principal) {
        var offer = findOffer(offerId);
        var listing = offer.getSwapListing();
        ensureParticipant(offer.getOffererId(), listing.getOwnerId(), principal.profileId());

        return messageRepository.findAllBySwapOfferIdOrderByCreatedAtAsc(offerId).stream()
            .map(m -> toResponse(m, principal.profileId()))
            .toList();
    }

    @Transactional
    public SwapOfferMessageResponse sendMessage(
        UUID offerId,
        UserPrincipal principal,
        CreateSwapOfferMessageRequest req
    ) {
        var offer = findOffer(offerId);
        var listing = offer.getSwapListing();
        ensureParticipant(offer.getOffererId(), listing.getOwnerId(), principal.profileId());
        ensureOfferOpen(offer.getStatus());

        String body = req.body().trim();
        var saved = messageRepository.save(SwapOfferMessage.builder()
            .swapOfferId(offerId)
            .senderId(principal.profileId())
            .body(body)
            .build());

        UUID recipientProfileId = principal.profileId().equals(offer.getOffererId())
            ? listing.getOwnerId()
            : offer.getOffererId();
        eventPublisher.publish(new SwapOfferChatMessageEvent(
            offerId, recipientProfileId, principal.profileId(), body));

        return toResponse(saved, principal.profileId());
    }

    private com.takkas.modules.swap.domain.SwapOffer findOffer(UUID offerId) {
        return swapOfferRepository.findById(offerId)
            .orElseThrow(() -> new ResourceNotFoundException("Teklif bulunamadı."));
    }

    private String resolveDisplayName(UUID profileId) {
        try {
            var summary = userFacade.getIndividualSummary(profileId);
            if (summary.fullName() != null && !summary.fullName().isBlank()) {
                return summary.fullName();
            }
        } catch (Exception ignored) {
            // fallback
        }
        return "Kullanıcı";
    }

    private static void ensureParticipant(UUID offererId, UUID ownerId, UUID requesterId) {
        if (!offererId.equals(requesterId) && !ownerId.equals(requesterId)) {
            throw new ForbiddenException("Bu takas sohbetine erişim yetkiniz yok.");
        }
    }

    private static void ensureOfferOpen(SwapOfferStatus status) {
        if (status != SwapOfferStatus.PENDING) {
            throw new BusinessRuleException("Bu teklif artık aktif değil; yeni mesaj gönderilemez.");
        }
    }

    private static SwapOfferMessageResponse toResponse(SwapOfferMessage m, UUID viewerId) {
        return new SwapOfferMessageResponse(
            m.getId(),
            m.getSwapOfferId(),
            m.getSenderId(),
            m.getBody(),
            m.getCreatedAt(),
            m.getSenderId().equals(viewerId)
        );
    }
}
