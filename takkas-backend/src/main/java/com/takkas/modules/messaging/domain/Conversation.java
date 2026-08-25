package com.takkas.modules.messaging.domain;

import com.takkas.common.exception.BusinessRuleException;
import com.takkas.modules.messaging.domain.enums.ConversationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "conversations", indexes = {
    @Index(name = "conv_business_user_idx",    columnList = "business_user_id"),
    @Index(name = "conv_individual_user_idx",  columnList = "individual_user_id")
})
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Conversation {

    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;

    @Column(name = "application_id", nullable = false, unique = true)
    private UUID applicationId;

    @Column(name = "business_user_id",    nullable = false) private UUID businessUserId;
    @Column(name = "individual_user_id",  nullable = false) private UUID individualUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ConversationStatus status = ConversationStatus.OPEN;

    @CreatedDate private Instant createdAt;
    private Instant closedAt;

    public void markOfferPending() {
        if (status != ConversationStatus.OPEN)
            throw new BusinessRuleException("Teklif sadece açık konuşmalara gönderilebilir.");
        status = ConversationStatus.OFFER_PENDING;
    }

    public void reopen() {
        if (status != ConversationStatus.OFFER_PENDING)
            throw new BusinessRuleException("Konuşma teklif beklemede değil.");
        status = ConversationStatus.OPEN;
    }

    public void agree() {
        if (status != ConversationStatus.OFFER_PENDING)
            throw new BusinessRuleException("Anlaşma sadece teklif beklemedeki konuşmalarda yapılabilir.");
        status   = ConversationStatus.AGREED;
        closedAt = Instant.now();
    }

    public void close() { status = ConversationStatus.CLOSED; closedAt = Instant.now(); }

    public boolean isWritable() {
        return status == ConversationStatus.OPEN || status == ConversationStatus.OFFER_PENDING;
    }

    public boolean isParticipant(UUID userId) {
        return businessUserId.equals(userId) || individualUserId.equals(userId);
    }

    public UUID peerUserId(UUID userId) {
        if (businessUserId.equals(userId)) return individualUserId;
        if (individualUserId.equals(userId)) return businessUserId;
        throw new BusinessRuleException("Konuşma katılımcısı değilsiniz.");
    }
}
