package com.takkas.modules.application.domain;

import com.takkas.common.exception.BusinessRuleException;
import com.takkas.modules.application.domain.enums.ApplicationStatus;
import com.takkas.modules.user.domain.IndividualProfile;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "applications",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_application_listing_individual",
        columnNames = {"listing_id", "individual_id"}),
    indexes = {
        @Index(name = "applications_listing_status_idx", columnList = "listing_id, status"),
        @Index(name = "applications_individual_idx", columnList = "individual_id, status")
    })
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Application {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "listing_id", nullable = false)
    private UUID listingId;

    @Column(name = "business_id", nullable = false)
    private UUID businessId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "individual_id", nullable = false)
    private IndividualProfile individual;

    @Column(columnDefinition = "TEXT")
    private String coverLetter;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ApplicationStatus status = ApplicationStatus.PENDING;

    @CreatedDate  private Instant appliedAt;
    @LastModifiedDate private Instant updatedAt;

    @Column(name = "submission_text", columnDefinition = "TEXT")
    private String submissionText;

    @ElementCollection
    @CollectionTable(
        name = "application_submission_images",
        joinColumns = @JoinColumn(name = "application_id"))
    @Column(name = "image_url", length = 2048)
    @Builder.Default
    private List<String> submissionImageUrls = new ArrayList<>();

    @ElementCollection
    @CollectionTable(
        name = "application_submission_attachments",
        joinColumns = @JoinColumn(name = "application_id"))
    @Column(name = "attachment_url", length = 2048)
    @Builder.Default
    private List<String> submissionAttachmentUrls = new ArrayList<>();

    @ElementCollection
    @CollectionTable(
        name = "application_submission_links",
        joinColumns = @JoinColumn(name = "application_id"))
    @Column(name = "link_url", length = 2048)
    @Builder.Default
    private List<String> submissionLinks = new ArrayList<>();

    private Instant submittedAt;
    private String reviewNote;
    private Instant reviewedAt;

    public void markUnderReview() {
        if (status != ApplicationStatus.PENDING)
            throw new BusinessRuleException("Sadece beklemedeki başvurular incelemeye alınabilir.");
        status = ApplicationStatus.UNDER_REVIEW;
    }

    public void accept() {
        if (status == ApplicationStatus.PENDING) {
            status = ApplicationStatus.UNDER_REVIEW;
        }
        if (status != ApplicationStatus.UNDER_REVIEW)
            throw new BusinessRuleException("Sadece incelemede olan başvurular kabul edilebilir.");
        status = ApplicationStatus.ACCEPTED;
    }

    public void reject() {
        if (status != ApplicationStatus.UNDER_REVIEW && status != ApplicationStatus.PENDING)
            throw new BusinessRuleException("Bu başvuru reddedilemez.");
        status = ApplicationStatus.REJECTED;
    }

    public void withdraw() {
        if (status != ApplicationStatus.PENDING)
            throw new BusinessRuleException("Sadece beklemedeki başvurular geri çekilebilir.");
        status = ApplicationStatus.WITHDRAWN;
    }

    public void submitWork(String text, List<String> imageUrls,
                           List<String> attachmentUrls, List<String> links) {
        if (status != ApplicationStatus.ACCEPTED)
            throw new BusinessRuleException("Teslim yalnızca onaylanmış başvurular için yapılabilir.");
        if (text == null || text.isBlank())
            throw new BusinessRuleException("Teslim açıklaması gerekli.");
        if (text.length() < 10)
            throw new BusinessRuleException("Teslim açıklaması en az 10 karakter olmalı.");

        List<String> images = imageUrls != null ? imageUrls : List.of();
        List<String> attachments = attachmentUrls != null ? attachmentUrls : List.of();
        List<String> linkList = links != null ? links : List.of();

        if (images.isEmpty() && attachments.isEmpty() && linkList.isEmpty())
            throw new BusinessRuleException("En az bir kanıt (fotoğraf, dosya veya bağlantı) gerekli.");
        if (images.size() > 5)
            throw new BusinessRuleException("En fazla 5 fotoğraf yüklenebilir.");
        if (attachments.size() > 5)
            throw new BusinessRuleException("En fazla 5 dosya yüklenebilir.");
        if (linkList.size() > 5)
            throw new BusinessRuleException("En fazla 5 bağlantı eklenebilir.");

        submissionText = text.trim();
        submissionImageUrls = new ArrayList<>(images);
        submissionAttachmentUrls = new ArrayList<>(attachments);
        submissionLinks = new ArrayList<>(linkList);
        submittedAt = Instant.now();
        status = ApplicationStatus.SUBMITTED;
    }

    public void approveSubmission(String note) {
        if (status != ApplicationStatus.SUBMITTED)
            throw new BusinessRuleException("Sadece teslim edilmiş başvurular onaylanabilir.");
        reviewNote = note != null ? note.trim() : "";
        reviewedAt = Instant.now();
        status = ApplicationStatus.SUBMISSION_APPROVED;
    }

    public void rejectSubmission(String note) {
        if (status != ApplicationStatus.SUBMITTED)
            throw new BusinessRuleException("Sadece teslim edilmiş başvurular reddedilebilir.");
        reviewNote = note != null && !note.isBlank() ? note.trim() : "Teslim uygun bulunmadı.";
        reviewedAt = Instant.now();
        status = ApplicationStatus.ACCEPTED;
    }

    public boolean isOwnedBy(UUID individualId) {
        return individual.getId().equals(individualId);
    }
}
