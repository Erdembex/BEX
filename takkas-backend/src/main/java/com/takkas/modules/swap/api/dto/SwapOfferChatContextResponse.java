package com.takkas.modules.swap.api.dto;

import com.takkas.modules.swap.domain.enums.SwapOfferStatus;

import java.util.UUID;

public record SwapOfferChatContextResponse(
    UUID offerId,
    UUID listingId,
    String listingTitle,
    String peerName,
    SwapOfferStatus status,
    String initialMessage) {}
