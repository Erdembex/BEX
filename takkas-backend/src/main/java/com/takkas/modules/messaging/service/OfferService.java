package com.takkas.modules.messaging.service;

import com.takkas.common.event.*;
import com.takkas.common.exception.*;
import com.takkas.modules.application.domain.Application;
import com.takkas.modules.application.domain.enums.ApplicationStatus;
import com.takkas.modules.application.repository.ApplicationRepository;
import com.takkas.modules.listing.domain.Listing;
import com.takkas.modules.listing.domain.ListingReward;
import com.takkas.modules.listing.domain.enums.ListingVisibility;
import com.takkas.modules.listing.repository.ListingRepository;
import com.takkas.modules.messaging.api.dto.*;
import com.takkas.modules.messaging.domain.*;
import com.takkas.modules.messaging.domain.enums.MessageType;
import com.takkas.modules.messaging.domain.enums.OfferStatus;
import com.takkas.modules.messaging.mapper.OfferMapper;
import com.takkas.modules.messaging.repository.*;
import com.takkas.modules.user.domain.BusinessProfile;
import com.takkas.modules.user.domain.IndividualProfile;
import com.takkas.modules.user.repository.BusinessProfileRepository;
import com.takkas.modules.user.repository.IndividualProfileRepository;
import com.takkas.modules.user.repository.UserRepository;
import com.takkas.modules.user.service.UserBlockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class OfferService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final OfferRepository offerRepository;
    private final ListingRepository listingRepository;
    private final ApplicationRepository applicationRepository;
    private final BusinessProfileRepository businessProfileRepository;
    private final IndividualProfileRepository individualProfileRepository;
    private final UserRepository userRepository;
    private final DomainEventPublisher eventPublisher;
    private final SimpMessagingTemplate messagingTemplate;
    private final MessageBufferService bufferService;
    private final UserBlockService userBlockService;

    public OfferResponse sendOffer(UUID conversationId, UUID senderId, SendOfferRequest req) {
        Conversation conv = getWritable(conversationId, senderId);
        if (!conv.getBusinessUserId().equals(senderId))
            throw new BusinessRuleException("Yalnızca işletme özel iş ilanı gönderebilir.");

        IndividualProfile targetIndividual = individualProfileRepository
            .findByUserId(conv.getIndividualUserId())
            .orElseThrow(() -> new ResourceNotFoundException("Aday profili bulunamadı."));
        BusinessProfile business = businessProfileRepository.findByUserId(senderId)
            .orElseThrow(() -> new ResourceNotFoundException("İşletme profili bulunamadı."));

        offerRepository.findPendingByConversationId(conversationId)
            .ifPresent(Offer::counter);

        Listing listing = Listing.builder()
            .business(business)
            .title(req.title().trim())
            .description(req.description().trim())
            .weeklyHours(req.weeklyHours())
            .expiresAt(req.expiresAt())
            .visibility(ListingVisibility.PRIVATE)
            .targetIndividual(targetIndividual)
            .sourceConversationId(conversationId)
            .build();
        req.skills().forEach(listing::addSkill);
        listing.setReward(ListingReward.builder()
            .rewardType(req.reward().rewardType())
            .quantity(req.reward().quantity())
            .unit(req.reward().unit())
            .validityDays(req.reward().validityDays())
            .description(req.reward().description())
            .build());
        listing = listingRepository.save(listing);
        listing.publishPrivate();
        listing = listingRepository.save(listing);

        Message message = messageRepository.save(Message.builder()
            .conversation(conv).senderId(senderId).messageType(MessageType.OFFER).build());
        Offer offer = offerRepository.save(Offer.builder()
            .message(message)
            .listingId(listing.getId())
            .rewardType(req.reward().rewardType())
            .quantity(req.reward().quantity())
            .unit(req.reward().unit())
            .validityDays(req.reward().validityDays())
            .note(req.note())
            .build());
        message.setOffer(offer);
        conv.markOfferPending();

        bufferService.incrementUnread(conversationId, conv.getIndividualUserId());
        eventPublisher.publish(new OfferSentEvent(conversationId, conv.getIndividualUserId(), senderId));

        OfferResponse response = OfferMapper.toResponse(offer, listing);
        messagingTemplate.convertAndSend("/topic/conversation/" + conversationId, response);
        return response;
    }

    public void acceptOffer(UUID conversationId, UUID acceptorId, UUID offerId) {
        Conversation conv = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new ResourceNotFoundException("Konuşma bulunamadı."));
        if (!conv.isParticipant(acceptorId)) throw new ForbiddenException("Erişim yetkiniz yok.");
        userBlockService.ensureCanInteract(acceptorId, conv.peerUserId(acceptorId));
        Offer offer = offerRepository.findById(offerId)
            .orElseThrow(() -> new ResourceNotFoundException("Teklif bulunamadı."));
        if (offer.getMessage().getSenderId().equals(acceptorId))
            throw new BusinessRuleException("Kendi teklifinizi kabul edemezsiniz.");
        if (offer.getListingId() == null)
            throw new BusinessRuleException("Bu teklif artık desteklenmiyor. Yeni bir iş ilanı isteyin.");

        Listing listing = listingRepository.findById(offer.getListingId())
            .orElseThrow(() -> new ResourceNotFoundException("İlan bulunamadı."));
        if (!listing.isPrivate() || listing.getTargetIndividual() == null
            || !listing.getTargetIndividual().getId().equals(
                individualProfileRepository.findByUserId(acceptorId)
                    .orElseThrow(() -> new ForbiddenException("Profil bulunamadı.")).getId())) {
            throw new ForbiddenException("Bu ilan size özel değil.");
        }
        if (applicationRepository.existsByListingIdAndIndividualId(
            listing.getId(), listing.getTargetIndividual().getId())) {
            throw new BusinessRuleException("Bu ilan için zaten başvurunuz var.");
        }

        offer.accept();
        conv.reopen();

        Application application = applicationRepository.save(Application.builder()
            .listingId(listing.getId())
            .businessId(listing.getBusiness().getId())
            .individual(listing.getTargetIndividual())
            .coverLetter("Sohbet üzerinden gönderilen özel iş ilanı kabul edildi.")
            .status(ApplicationStatus.ACCEPTED)
            .build());
        offer.setResultApplicationId(application.getId());

        UUID businessUserId = userRepository.findUserIdByBusinessProfileId(listing.getBusiness().getId());
        eventPublisher.publish(new ApplicationAcceptedEvent(
            application.getId(), listing.getId(), listing.getBusiness().getId(),
            listing.getTargetIndividual().getId(), businessUserId, acceptorId));
        eventPublisher.publish(new PrivateListingAcceptedEvent(
            conversationId, businessUserId, application.getId(), listing.getId()));

        messagingTemplate.convertAndSend("/topic/conversation/" + conversationId,
            new OfferStatusUpdate(offerId, OfferStatus.ACCEPTED));
    }

    public void rejectOffer(UUID conversationId, UUID rejectorId, UUID offerId) {
        Conversation conv = getWritable(conversationId, rejectorId);
        Offer offer = offerRepository.findById(offerId)
            .orElseThrow(() -> new ResourceNotFoundException("Teklif bulunamadı."));
        if (offer.getMessage().getSenderId().equals(rejectorId))
            throw new BusinessRuleException("Kendi teklifinizi reddedemezsiniz.");
        offer.reject();
        conv.reopen();
        if (offer.getListingId() != null) {
            listingRepository.findById(offer.getListingId()).ifPresent(listing -> {
                if (listing.isPrivate() && listing.isActive()) listing.close();
            });
        }
        eventPublisher.publish(new OfferRejectedEvent(conversationId,
            offer.getMessage().getSenderId(), rejectorId));
        messagingTemplate.convertAndSend("/topic/conversation/" + conversationId,
            new OfferStatusUpdate(offerId, OfferStatus.REJECTED));
    }

    private Conversation getWritable(UUID cid, UUID userId) {
        Conversation conv = conversationRepository.findById(cid)
            .orElseThrow(() -> new ResourceNotFoundException("Konuşma bulunamadı."));
        if (!conv.isParticipant(userId)) throw new ForbiddenException("Erişim yetkiniz yok.");
        if (!conv.isWritable()) throw new BusinessRuleException("Bu konuşmaya işlem yapılamaz.");
        userBlockService.ensureCanInteract(userId, conv.peerUserId(userId));
        return conv;
    }
}
