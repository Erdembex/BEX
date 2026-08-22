package com.takkas.modules.notification.service;

import com.takkas.modules.notification.domain.Notification;
import com.takkas.modules.notification.domain.enums.NotificationType;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class NotificationFactory {

    public Notification applicationReceived(UUID businessUserId, UUID applicationId, String individualName) {
        return build(businessUserId, NotificationType.APPLICATION_RECEIVED, applicationId, "APPLICATION",
            "Yeni Başvuru", individualName + " ilanınıza başvurdu.");
    }

    public Notification applicationAccepted(UUID individualUserId, UUID applicationId, String businessName) {
        return build(individualUserId, NotificationType.APPLICATION_ACCEPTED, applicationId, "APPLICATION",
            "Başvurun Kabul Edildi 🎉", businessName + " başvurunu kabul etti. Şimdi pazarlık başlayabilir!");
    }

    public Notification applicationRejected(UUID individualUserId, UUID applicationId, String businessName) {
        return build(individualUserId, NotificationType.APPLICATION_REJECTED, applicationId, "APPLICATION",
            "Başvuru Sonucu", businessName + " bu sefer başvurunu kabul etmedi.");
    }

    public Notification submissionSubmitted(UUID businessUserId, UUID applicationId, String individualName) {
        return build(businessUserId, NotificationType.SUBMISSION_SUBMITTED, applicationId, "APPLICATION",
            "Yeni teslim", individualName + " görev teslimi yükledi. Admin incelemesi bekleniyor.");
    }

    public Notification submissionApprovedForBusiness(UUID businessUserId, UUID applicationId) {
        return build(businessUserId, NotificationType.SUBMISSION_APPROVED, applicationId, "APPLICATION",
            "Teslim admin onayladı", "Kullanıcı teslimi uygun bulundu. Başvurularından kupon verebilirsin.");
    }

    public Notification submissionApprovedForIndividual(UUID individualUserId, UUID applicationId) {
        return build(individualUserId, NotificationType.SUBMISSION_APPROVED, applicationId, "APPLICATION",
            "Teslimin onaylandı", "Admin içeriği onayladı. Görsellerin portföyünde görünür.");
    }

    public Notification submissionRejected(UUID individualUserId, UUID applicationId, String note) {
        return build(individualUserId, NotificationType.SUBMISSION_REJECTED, applicationId, "APPLICATION",
            "Teslimin reddedildi", note);
    }

    public Notification kycVerificationPending(UUID adminUserId, UUID profileId, String businessName) {
        return build(adminUserId, NotificationType.KYC_VERIFICATION_PENDING, profileId, "BUSINESS_PROFILE",
            "Yeni KYC evrakı", businessName + " doğrulama evrakı yükledi. İnceleme bekliyor.");
    }

    public Notification kycVerificationApproved(UUID businessUserId, UUID profileId, String businessName) {
        return build(businessUserId, NotificationType.KYC_VERIFICATION_APPROVED, profileId, "BUSINESS_PROFILE",
            "KYC onaylandı", businessName + " doğrulandı. Güven rozetin aktif.");
    }

    public Notification kycVerificationRejected(UUID businessUserId, UUID profileId, String businessName) {
        return build(businessUserId, NotificationType.KYC_VERIFICATION_REJECTED, profileId, "BUSINESS_PROFILE",
            "KYC reddedildi", businessName + " evrak incelemesi olumsuz. Yeni evrak yükleyebilirsin.");
    }

    public Notification newMessage(UUID recipientUserId, UUID conversationId, String senderName) {
        return build(recipientUserId, NotificationType.NEW_MESSAGE, conversationId, "CONVERSATION",
            "Yeni Mesaj", senderName + " sana mesaj gönderdi.");
    }

    public Notification offerReceived(UUID recipientUserId, UUID conversationId, String senderName) {
        return build(recipientUserId, NotificationType.OFFER_RECEIVED, conversationId, "CONVERSATION",
            "Özel İş İlanı", senderName + " sana özel bir iş ilanı gönderdi.");
    }

    public Notification offerAccepted(UUID senderUserId, UUID conversationId, String acceptorName) {
        return build(senderUserId, NotificationType.OFFER_ACCEPTED, conversationId, "CONVERSATION",
            "İş İlanı Kabul Edildi ✅", acceptorName + " özel iş ilanını kabul etti. Teslimat bekleniyor.");
    }

    public Notification offerRejected(UUID senderUserId, UUID conversationId, String rejectorName) {
        return build(senderUserId, NotificationType.OFFER_REJECTED, conversationId, "CONVERSATION",
            "Teklif Reddedildi", rejectorName + " teklifini reddetti.");
    }

    public Notification couponIssued(UUID individualUserId, UUID couponId,
                                      String businessName, String rewardDesc) {
        return build(individualUserId, NotificationType.COUPON_ISSUED, couponId, "COUPON",
            "Kuponun Hazır! 🎁", businessName + " sana " + rewardDesc + " tanımladı.");
    }

    public Notification couponExpiringSoon(UUID individualUserId, UUID couponId,
                                            String rewardDesc, long daysLeft) {
        return build(individualUserId, NotificationType.COUPON_EXPIRING_SOON, couponId, "COUPON",
            "Kuponun Sona Eriyor ⏰", rewardDesc + " kuponunun süresi " + daysLeft + " gün sonra doluyor.");
    }

    public Notification swapOfferReceived(UUID ownerUserId, UUID swapOfferId,
                                           String offererName, String offeredReward) {
        return build(ownerUserId, NotificationType.SWAP_OFFER_RECEIVED, swapOfferId, "SWAP",
            "Takas Teklifi Geldi", offererName + " " + offeredReward + " karşılığında takas teklifi gönderdi.");
    }

    public Notification swapOfferRejected(UUID offererUserId, UUID swapOfferId, String ownerName) {
        return build(offererUserId, NotificationType.SWAP_OFFER_REJECTED, swapOfferId, "SWAP",
            "Takas Teklifi Reddedildi", ownerName + " bu sefer takas teklifini kabul etmedi.");
    }

    public Notification swapOfferChatMessage(UUID recipientUserId, UUID swapOfferId,
                                              String senderName, String preview) {
        String body = preview != null && preview.length() > 120
            ? preview.substring(0, 117) + "..."
            : preview;
        return build(recipientUserId, NotificationType.SWAP_OFFER_MESSAGE, swapOfferId, "SWAP",
            "Takas sohbeti — " + senderName, body != null ? body : "Yeni mesaj");
    }

    public Notification swapCompleted(UUID userId, UUID swapTradeId,
                                       String otherPartyName, String receivedReward) {
        return build(userId, NotificationType.SWAP_COMPLETED, swapTradeId, "SWAP",
            "Takas Tamamlandı 🔄✅",
            otherPartyName + " ile takas tamamlandı. " + receivedReward + " kuponun sana transfer edildi.");
    }

    public Notification subscriptionPaymentFailed(UUID businessUserId, UUID businessId) {
        return build(businessUserId, NotificationType.SUBSCRIPTION_PAYMENT_FAILED, businessId, "SUBSCRIPTION",
            "Ödeme Başarısız ⚠️",
            "Abonelik ödemeniz alınamadı. 3 gün içinde güncellemezseniz hesabınız kısıtlanacak.");
    }

    public Notification planUpgraded(UUID businessUserId, UUID businessId, String newPlanName) {
        return build(businessUserId, NotificationType.PLAN_UPGRADED, businessId, "SUBSCRIPTION",
            "Plan Yükseltildi 🚀", newPlanName + " planına geçiş yapıldı. Yeni özellikler aktif!");
    }

    public Notification subscriptionRenewed(UUID businessUserId, UUID businessId, String planName) {
        return build(businessUserId, NotificationType.SUBSCRIPTION_RENEWED, businessId, "SUBSCRIPTION",
            "Abonelik Yenilendi", planName + " planınız başarıyla yenilendi.");
    }

    public Notification subscriptionUpgradeRequested(UUID adminUserId, UUID businessId,
                                                       String businessName, String targetPlanDisplayName) {
        return build(adminUserId, NotificationType.SUBSCRIPTION_UPGRADE_REQUESTED, businessId, "SUBSCRIPTION",
            "Yeni Abonelik Talebi 💳",
            businessName + " " + targetPlanDisplayName + " planına yükseltme talep etti. Ödeme onayı bekliyor.");
    }

    private Notification build(UUID userId, NotificationType type,
                                UUID referenceId, String referenceType,
                                String title, String body) {
        return Notification.builder()
            .userId(userId).type(type)
            .referenceId(referenceId).referenceType(referenceType)
            .title(title).body(body).isRead(false).build();
    }
}
