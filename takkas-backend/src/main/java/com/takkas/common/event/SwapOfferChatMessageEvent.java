package com.takkas.common.event;

import java.util.UUID;

public record SwapOfferChatMessageEvent(
    UUID swapOfferId,
    UUID recipientProfileId,
    UUID senderProfileId,
    String messagePreview) {}
