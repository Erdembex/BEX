package com.takkas.modules.messaging.service;

import com.takkas.common.exception.BusinessRuleException;
import com.takkas.common.exception.ResourceNotFoundException;
import com.takkas.modules.messaging.api.dto.ConversationResponse;
import com.takkas.modules.messaging.domain.Conversation;
import com.takkas.modules.messaging.mapper.ConversationMapper;
import com.takkas.modules.messaging.repository.ConversationRepository;
import com.takkas.modules.user.domain.enums.UserType;
import com.takkas.modules.user.repository.UserRepository;
import com.takkas.modules.user.service.UserBlockService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class DirectConversationService {

    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final UserBlockService userBlockService;
    private final MessageBufferService bufferService;

    public ConversationResponse open(UUID businessUserId, UUID individualUserId) {
        if (businessUserId.equals(individualUserId)) {
            throw new BusinessRuleException("Kendinize ilan gönderemezsiniz.");
        }

        var individual = userRepository.findById(individualUserId)
            .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı."));
        if (individual.getUserType() != UserType.INDIVIDUAL) {
            throw new BusinessRuleException("İlan yalnızca bireysel hesaplara gönderilebilir.");
        }

        userBlockService.ensureCanInteract(businessUserId, individualUserId);

        var existing = conversationRepository
            .findByBusinessUserIdAndIndividualUserIdAndApplicationIdIsNull(businessUserId, individualUserId);
        if (existing.isPresent()) {
            var conv = existing.get();
            return ConversationMapper.toResponse(conv, bufferService.getUnreadCount(conv.getId(), businessUserId));
        }

        Conversation created = conversationRepository.save(Conversation.builder()
            .businessUserId(businessUserId)
            .individualUserId(individualUserId)
            .build());
        return ConversationMapper.toResponse(created, 0);
    }
}
