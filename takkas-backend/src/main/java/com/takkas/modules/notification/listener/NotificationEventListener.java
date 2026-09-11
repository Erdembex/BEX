package com.takkas.modules.notification.listener;

import com.takkas.common.event.*;
import com.takkas.modules.notification.service.*;
import com.takkas.modules.user.UserFacade;
import com.takkas.modules.user.domain.enums.UserType;
import com.takkas.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.temporal.ChronoUnit;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventListener {

    private final NotificationService notificationService;
    private final NotificationFactory factory;
    private final UserFacade userFacade;
    private final UserRepository userRepository;

    // ── Başvuru ──────────────────────────────────────────

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(ApplicationReceivedEvent e) {
        try {
            String name = userFacade.getIndividualSummary(e.individualId()).fullName();
            notificationService.create(
                factory.applicationReceived(e.businessUserId(), e.applicationId(), name));
        } catch (Exception ex) { log.error("[NTF] APPLICATION_RECEIVED: {}", ex.getMessage()); }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(ApplicationAcceptedEvent e) {
        try {
            String name = userFacade.getBusinessSummary(e.businessId()).businessName();
            notificationService.create(
                factory.applicationAccepted(e.individualUserId(), e.applicationId(), name));
        } catch (Exception ex) { log.error("[NTF] APPLICATION_ACCEPTED: {}", ex.getMessage()); }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(ApplicationRejectedEvent e) {
        try {
            notificationService.create(
                factory.applicationRejected(e.individualUserId(), e.applicationId(), "İşletme"));
        } catch (Exception ex) { log.error("[NTF] APPLICATION_REJECTED: {}", ex.getMessage()); }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(ApplicationSubmissionSubmittedEvent e) {
        try {
            String name = userFacade.getIndividualSummary(e.individualProfileId()).fullName();
            notificationService.create(
                factory.submissionSubmitted(e.businessUserId(), e.applicationId(), name));
        } catch (Exception ex) { log.error("[NTF] SUBMISSION_SUBMITTED: {}", ex.getMessage()); }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(ApplicationSubmissionApprovedEvent e) {
        try {
            notificationService.create(
                factory.submissionApprovedForBusiness(e.businessUserId(), e.applicationId()));
            notificationService.create(
                factory.submissionApprovedForIndividual(e.individualUserId(), e.applicationId()));
        } catch (Exception ex) { log.error("[NTF] SUBMISSION_APPROVED: {}", ex.getMessage()); }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(ApplicationSubmissionRejectedEvent e) {
        try {
            String note = e.reviewNote() != null && !e.reviewNote().isBlank()
                ? e.reviewNote()
                : "İçerik uygunsuz. Lütfen düzeltip tekrar teslim et.";
            notificationService.create(
                factory.submissionRejected(e.individualUserId(), e.applicationId(), note));
        } catch (Exception ex) { log.error("[NTF] SUBMISSION_REJECTED: {}", ex.getMessage()); }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(BusinessVerificationSubmittedEvent e) {
        try {
            for (var admin : userRepository.findByUserType(UserType.ADMIN)) {
                notificationService.create(
                    factory.kycVerificationPending(admin.getId(), e.profileId(), e.businessName()));
            }
        } catch (Exception ex) { log.error("[NTF] KYC_SUBMITTED: {}", ex.getMessage()); }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(BusinessVerificationApprovedEvent e) {
        try {
            notificationService.create(
                factory.kycVerificationApproved(e.businessUserId(), e.profileId(), e.businessName()));
        } catch (Exception ex) { log.error("[NTF] KYC_APPROVED: {}", ex.getMessage()); }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(BusinessVerificationRejectedEvent e) {
        try {
            notificationService.create(
                factory.kycVerificationRejected(e.businessUserId(), e.profileId(), e.businessName()));
        } catch (Exception ex) { log.error("[NTF] KYC_REJECTED: {}", ex.getMessage()); }
    }

    // ── Teklif / Mesaj ────────────────────────────────────

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(MessageSentEvent e) {
        try {
            String senderName = userFacade.getDisplayNameForUserId(e.senderUserId());
            notificationService.create(
                factory.newMessage(
                    e.recipientUserId(), e.conversationId(), senderName, e.messagePreview()));
        } catch (Exception ex) { log.error("[NTF] NEW_MESSAGE: {}", ex.getMessage()); }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(OfferSentEvent e) {
        try {
            String senderName = userFacade.getBusinessSummary(
                userFacade.getBusinessProfileIdByUserId(e.senderUserId())).businessName();
            notificationService.create(
                factory.offerReceived(e.recipientUserId(), e.conversationId(), senderName));
        } catch (Exception ex) { log.error("[NTF] OFFER_RECEIVED: {}", ex.getMessage()); }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(PrivateListingAcceptedEvent e) {
        try {
            notificationService.create(
                factory.offerAccepted(e.businessUserId(), e.conversationId(), "Aday"));
        } catch (Exception ex) { log.error("[NTF] PRIVATE_LISTING_ACCEPTED: {}", ex.getMessage()); }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(OfferAcceptedEvent e) {
        try {
            var businessUserId = userFacade.getUserIdByBusinessProfileId(e.businessId());
            notificationService.create(
                factory.offerAccepted(businessUserId, e.conversationId(), "Aday"));
        } catch (Exception ex) { log.error("[NTF] OFFER_ACCEPTED: {}", ex.getMessage()); }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(OfferRejectedEvent e) {
        try {
            notificationService.create(
                factory.offerRejected(e.businessUserId(), e.conversationId(), "Aday"));
        } catch (Exception ex) { log.error("[NTF] OFFER_REJECTED: {}", ex.getMessage()); }
    }

    // ── Kupon ─────────────────────────────────────────────

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(CouponIssuedEvent e) {
        try {
            String businessName = userFacade.getBusinessSummary(e.businessId()).businessName();
            String rewardDesc   = e.quantity() + " " + e.unit();
            var userId = userFacade.getUserIdByIndividualProfileId(e.ownerId());
            notificationService.create(
                factory.couponIssued(userId, e.couponId(), businessName, rewardDesc));
        } catch (Exception ex) { log.error("[NTF] COUPON_ISSUED: {}", ex.getMessage()); }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(CouponExpiringSoonEvent e) {
        try {
            long daysLeft = ChronoUnit.DAYS.between(
                java.time.Instant.now(), e.expiresAt());
            var userId = userFacade.getUserIdByIndividualProfileId(e.ownerId());
            notificationService.create(
                factory.couponExpiringSoon(userId, e.couponId(), "Kuponun", daysLeft));
        } catch (Exception ex) { log.error("[NTF] COUPON_EXPIRING_SOON: {}", ex.getMessage()); }
    }

    // ── Swap ──────────────────────────────────────────────

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(SwapOfferReceivedEvent e) {
        try {
            String offererName = userFacade.getIndividualSummary(e.offererProfileId()).fullName();
            var ownerUserId    = userFacade.getUserIdByIndividualProfileId(e.listingOwnerProfileId());
            notificationService.create(
                factory.swapOfferReceived(ownerUserId, e.swapOfferId(), offererName, "bir kupon"));
        } catch (Exception ex) { log.error("[NTF] SWAP_OFFER_RECEIVED: {}", ex.getMessage()); }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(SwapOfferRejectedEvent e) {
        try {
            var offererUserId = userFacade.getUserIdByIndividualProfileId(e.offererProfileId());
            notificationService.create(
                factory.swapOfferRejected(offererUserId, e.swapOfferId(), "İlan Sahibi"));
        } catch (Exception ex) { log.error("[NTF] SWAP_OFFER_REJECTED: {}", ex.getMessage()); }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(SwapOfferChatMessageEvent e) {
        try {
            var recipientUserId = userFacade.getUserIdByIndividualProfileId(e.recipientProfileId());
            String senderName = userFacade.getIndividualSummary(e.senderProfileId()).fullName();
            notificationService.create(
                factory.swapOfferChatMessage(
                    recipientUserId, e.swapOfferId(), senderName, e.messagePreview()));
        } catch (Exception ex) { log.error("[NTF] SWAP_OFFER_MESSAGE: {}", ex.getMessage()); }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(SwapCompletedEvent e) {
        try {
            String initiatorName = userFacade.getIndividualSummary(e.initiatorProfileId()).fullName();
            String offererName   = userFacade.getIndividualSummary(e.offererProfileId()).fullName();
            var initiatorUserId  = userFacade.getUserIdByIndividualProfileId(e.initiatorProfileId());
            var offererUserId    = userFacade.getUserIdByIndividualProfileId(e.offererProfileId());
            notificationService.create(
                factory.swapCompleted(initiatorUserId, e.swapTradeId(), offererName, "Yeni"));
            notificationService.create(
                factory.swapCompleted(offererUserId, e.swapTradeId(), initiatorName, "Yeni"));
        } catch (Exception ex) { log.error("[NTF] SWAP_COMPLETED: {}", ex.getMessage()); }
    }

    // ── Abonelik ──────────────────────────────────────────

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(SubscriptionPaymentFailedEvent e) {
        try {
            var businessUserId = userFacade.getUserIdByBusinessProfileId(e.businessId());
            notificationService.create(
                factory.subscriptionPaymentFailed(businessUserId, e.businessId()));
        } catch (Exception ex) { log.error("[NTF] SUBSCRIPTION_PAYMENT_FAILED: {}", ex.getMessage()); }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(SubscriptionChangedEvent e) {
        try {
            var businessUserId = userFacade.getUserIdByBusinessProfileId(e.businessId());
            boolean isUpgrade  = !e.newPlanName().equals("FREE")
                && !e.newPlanName().equals(e.oldPlanName());
            var notification = isUpgrade
                ? factory.planUpgraded(businessUserId, e.businessId(), e.newPlanName())
                : factory.subscriptionRenewed(businessUserId, e.businessId(), e.newPlanName());
            notificationService.create(notification);
        } catch (Exception ex) { log.error("[NTF] SUBSCRIPTION_CHANGED: {}", ex.getMessage()); }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(SubscriptionUpgradeRequestedEvent e) {
        try {
            for (var admin : userRepository.findByUserType(UserType.ADMIN)) {
                notificationService.create(factory.subscriptionUpgradeRequested(
                    admin.getId(), e.businessId(), e.businessName(), e.targetPlanDisplayName()));
            }
        } catch (Exception ex) { log.error("[NTF] SUBSCRIPTION_UPGRADE_REQUESTED: {}", ex.getMessage()); }
    }
}
