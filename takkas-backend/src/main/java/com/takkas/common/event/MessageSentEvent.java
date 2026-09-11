package com.takkas.common.event;

import java.util.UUID;

public record MessageSentEvent(
    UUID conversationId,
    UUID senderUserId,
    UUID recipientUserId,
    String messagePreview) {}
