package com.takkas.modules.messaging.api;

import com.takkas.common.exception.ForbiddenException;
import jakarta.validation.Valid;
import com.takkas.common.pagination.PageResponse;
import com.takkas.common.pagination.CursorPagination;
import com.takkas.common.security.*;
import com.takkas.modules.messaging.api.dto.*;
import com.takkas.modules.listing.repository.ListingRepository;
import com.takkas.modules.messaging.mapper.ConversationMapper;
import com.takkas.modules.messaging.mapper.MessageMapper;
import com.takkas.modules.messaging.repository.ConversationRepository;
import com.takkas.modules.messaging.repository.MessageRepository;
import com.takkas.modules.messaging.service.MessageImageReportService;
import com.takkas.modules.messaging.service.MessageBufferService;
import com.takkas.modules.messaging.service.MessageService;
import com.takkas.modules.messaging.service.OfferService;
import com.takkas.modules.user.service.UserBlockService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.UUID;

@Tag(name = "Mesajlaşma", description = "Sohbetler, mesajlar ve teklifler")
@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final MessageBufferService bufferService;
    private final MessageService messageService;
    private final OfferService offerService;
    private final MessageImageReportService messageImageReportService;
    private final ListingRepository listingRepository;
    private final UserBlockService userBlockService;

    @GetMapping
    public List<ConversationResponse> getInbox(@CurrentUser UserPrincipal p) {
        var blockedPeers = userBlockService.blockedPeerUserIds(p.userId());
        return conversationRepository.findAllByParticipant(p.userId()).stream()
            .filter(c -> !blockedPeers.contains(c.peerUserId(p.userId())))
            .map(c -> ConversationMapper.toResponse(c,
                bufferService.getUnreadCount(c.getId(), p.userId())))
            .toList();
    }

    @GetMapping("/by-application/{applicationId}")
    public ConversationResponse getByApplication(@CurrentUser UserPrincipal p,
                                                  @PathVariable UUID applicationId) {
        var conv = conversationRepository.findByApplicationId(applicationId)
            .orElseThrow(() -> new ForbiddenException("Bu başvuru için konuşma bulunamadı."));
        if (!conv.isParticipant(p.userId()))
            throw new ForbiddenException("Erişim yetkiniz yok.");
        userBlockService.ensureCanInteract(p.userId(), conv.peerUserId(p.userId()));
        return ConversationMapper.toResponse(conv,
            bufferService.getUnreadCount(conv.getId(), p.userId()));
    }

    @GetMapping("/{id}")
    public ConversationResponse getById(@CurrentUser UserPrincipal p, @PathVariable UUID id) {
        var conv = conversationRepository.findById(id)
            .orElseThrow(() -> new ForbiddenException("Konuşma bulunamadı."));
        if (!conv.isParticipant(p.userId()))
            throw new ForbiddenException("Erişim yetkiniz yok.");
        userBlockService.ensureCanInteract(p.userId(), conv.peerUserId(p.userId()));
        return ConversationMapper.toResponse(conv,
            bufferService.getUnreadCount(conv.getId(), p.userId()));
    }

    @GetMapping("/{id}/messages")
    @Transactional
    public PageResponse<MessageResponse> getMessages(@CurrentUser UserPrincipal p,
                                                       @PathVariable UUID id,
                                                       @RequestParam(required = false) Instant cursor,
                                                       @RequestParam(defaultValue = "20") int pageSize) {
        var conv = conversationRepository.findById(id)
            .orElseThrow(() -> new ForbiddenException("Konuşma bulunamadı."));
        if (!conv.isParticipant(p.userId()))
            throw new ForbiddenException("Erişim yetkiniz yok.");
        userBlockService.ensureCanInteract(p.userId(), conv.peerUserId(p.userId()));
        messageRepository.markAllAsRead(id, p.userId());
        bufferService.clearUnread(id, p.userId());
        Instant effectiveCursor = CursorPagination.effectiveCursor(cursor);
        var messages = messageRepository.findByConversationWithCursor(
            id, effectiveCursor, p.userId(), PageRequest.of(0, pageSize));
        return PageResponse.of(messages.stream()
                .map(m -> MessageMapper.toResponse(m, listingRepository)).toList(),
            messages.isEmpty() ? null : messages.getLast().getCreatedAt());
    }

    @PostMapping("/{id}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse sendMessage(@CurrentUser UserPrincipal p,
                                        @PathVariable UUID id,
                                        @Valid @RequestBody SendMessageRequest req) {
        return messageService.send(id, p.userId(), req.content(), req.mediaUrl());
    }

    @PatchMapping("/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void markAsRead(@CurrentUser UserPrincipal p, @PathVariable UUID id) {
        if (!conversationRepository.isParticipant(id, p.userId()))
            throw new ForbiddenException("Erişim yetkiniz yok.");
        messageRepository.markAllAsRead(id, p.userId());
        bufferService.clearUnread(id, p.userId());
    }

    @PostMapping("/{id}/offers")
    @ResponseStatus(HttpStatus.CREATED)
    public OfferResponse sendOffer(@CurrentUser UserPrincipal p, @PathVariable UUID id,
                                    @Valid @RequestBody SendOfferRequest req) {
        return offerService.sendOffer(id, p.userId(), req);
    }

    @PatchMapping("/{id}/offers/{offerId}/accept")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void acceptOffer(@CurrentUser UserPrincipal p, @PathVariable UUID id,
                             @PathVariable UUID offerId) {
        offerService.acceptOffer(id, p.userId(), offerId);
    }

    @PatchMapping("/{id}/offers/{offerId}/reject")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void rejectOffer(@CurrentUser UserPrincipal p, @PathVariable UUID id,
                             @PathVariable UUID offerId) {
        offerService.rejectOffer(id, p.userId(), offerId);
    }

    @PostMapping("/{id}/messages/{messageId}/report-image")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageImageReportResponse reportImage(@CurrentUser UserPrincipal p,
                                                   @PathVariable UUID id,
                                                   @PathVariable UUID messageId,
                                                   @Valid @RequestBody ReportMessageImageRequest req) {
        return messageImageReportService.report(id, messageId, p.userId(), req);
    }
}
