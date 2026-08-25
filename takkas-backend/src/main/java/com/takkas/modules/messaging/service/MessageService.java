package com.takkas.modules.messaging.service;

import com.takkas.common.exception.BusinessRuleException;
import com.takkas.modules.messaging.api.dto.MessageResponse;
import com.takkas.modules.messaging.domain.Conversation;
import com.takkas.modules.messaging.domain.Message;
import com.takkas.modules.messaging.domain.enums.MessageType;
import com.takkas.modules.listing.repository.ListingRepository;
import com.takkas.modules.messaging.mapper.MessageMapper;
import com.takkas.modules.messaging.repository.ConversationRepository;
import com.takkas.modules.messaging.repository.MessageRepository;
import com.takkas.modules.user.service.UserBlockService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final MessageBufferService bufferService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ListingRepository listingRepository;
    private final UserBlockService userBlockService;

    @Transactional
    public MessageResponse send(UUID conversationId, UUID senderId, String content, String mediaUrl) {
        boolean hasMedia = mediaUrl != null && !mediaUrl.isBlank();
        if (hasMedia) {
            return sendImage(conversationId, senderId, content, mediaUrl.trim());
        }
        return sendText(conversationId, senderId, content);
    }

    @Transactional
    public MessageResponse sendText(UUID conversationId, UUID senderId, String content) {
        String trimmed = content == null ? "" : content.trim();
        if (trimmed.isEmpty()) {
            throw new BusinessRuleException("Mesaj boş olamaz.");
        }
        if (trimmed.length() > 1000) {
            throw new BusinessRuleException("Mesaj en fazla 1000 karakter olabilir.");
        }

        Conversation conv = loadWritableConversation(conversationId, senderId);
        Message saved = persistMessage(conv, senderId, MessageType.TEXT, trimmed, null);
        return publishMessage(conv, senderId, saved);
    }

    @Transactional
    public MessageResponse sendImage(UUID conversationId, UUID senderId, String caption, String mediaUrl) {
        String normalizedUrl = normalizeMediaUrl(mediaUrl);
        validateSenderOwnsUpload(senderId, normalizedUrl);

        String trimmedCaption = caption == null ? "" : caption.trim();
        if (trimmedCaption.length() > 500) {
            throw new BusinessRuleException("Görsel açıklaması en fazla 500 karakter olabilir.");
        }

        Conversation conv = loadWritableConversation(conversationId, senderId);
        Message saved = persistMessage(
            conv,
            senderId,
            MessageType.IMAGE,
            trimmedCaption.isEmpty() ? null : trimmedCaption,
            normalizedUrl
        );
        return publishMessage(conv, senderId, saved);
    }

    /**
     * Sistem tarafından üretilen ve yalnızca tek bir kullanıcıya görünen bilgi mesajı.
     * Karşı taraf farklı bir metin görebileceği için websocket ile herkese yayınlanmaz;
     * alıcı sohbeti bir sonraki yüklemede/pollingde görür.
     */
    @Transactional
    public void sendSystemMessage(UUID conversationId, UUID visibleToUserId, String content) {
        Conversation conv = conversationRepository.findById(conversationId).orElse(null);
        if (conv == null) return;

        messageRepository.save(Message.builder()
            .id(UUID.randomUUID())
            .conversation(conv)
            .senderId(visibleToUserId)
            .messageType(MessageType.SYSTEM)
            .content(content)
            .visibleToUserId(visibleToUserId)
            .isRead(true)
            .createdAt(Instant.now())
            .build());
    }

    private Conversation loadWritableConversation(UUID conversationId, UUID senderId) {
        Conversation conv = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new BusinessRuleException("Konuşma bulunamadı."));
        if (!conv.isParticipant(senderId)) {
            throw new BusinessRuleException("Erişim yetkiniz yok.");
        }
        if (!conv.isWritable()) {
            throw new BusinessRuleException("Bu konuşmaya mesaj gönderilemez.");
        }
        userBlockService.ensureCanInteract(senderId, conv.peerUserId(senderId));
        return conv;
    }

    private Message persistMessage(
        Conversation conv,
        UUID senderId,
        MessageType type,
        String content,
        String mediaUrl
    ) {
        Instant now = Instant.now();
        return messageRepository.save(Message.builder()
            .id(UUID.randomUUID())
            .conversation(conv)
            .senderId(senderId)
            .messageType(type)
            .content(content)
            .mediaUrl(mediaUrl)
            .createdAt(now)
            .isRead(false)
            .build());
    }

    private MessageResponse publishMessage(Conversation conv, UUID senderId, Message saved) {
        UUID recipientId = conv.getBusinessUserId().equals(senderId)
            ? conv.getIndividualUserId() : conv.getBusinessUserId();
        bufferService.incrementUnread(conv.getId(), recipientId);

        MessageResponse response = MessageMapper.toResponse(saved, listingRepository);
        messagingTemplate.convertAndSend("/topic/conversation/" + conv.getId(), response);
        return response;
    }

    private String normalizeMediaUrl(String mediaUrl) {
        String trimmed = mediaUrl.trim();
        if (!trimmed.startsWith("/uploads/")) {
            throw new BusinessRuleException("Geçersiz görsel adresi.");
        }
        if (trimmed.contains("..")) {
            throw new BusinessRuleException("Geçersiz görsel adresi.");
        }
        return trimmed;
    }

    private void validateSenderOwnsUpload(UUID senderId, String mediaUrl) {
        String prefix = "/uploads/" + senderId + "/";
        if (!mediaUrl.startsWith(prefix)) {
            throw new BusinessRuleException("Yalnızca kendi yüklediğin görselleri gönderebilirsin.");
        }
    }
}
