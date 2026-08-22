package com.takkas.modules.application.service;

import com.takkas.common.event.DomainEventPublisher;
import com.takkas.common.event.*;
import com.takkas.common.exception.*;
import com.takkas.modules.application.api.dto.*;
import com.takkas.modules.application.domain.Application;
import com.takkas.modules.application.domain.enums.ApplicationStatus;
import com.takkas.modules.application.mapper.ApplicationMapper;
import com.takkas.modules.application.repository.ApplicationRepository;
import com.takkas.modules.listing.ListingFacade;
import com.takkas.modules.subscription.domain.enums.FeatureKey;
import com.takkas.modules.subscription.service.FeatureGateService;
import com.takkas.modules.user.domain.IndividualProfile;
import com.takkas.modules.user.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final IndividualProfileRepository individualProfileRepository;
    private final UserRepository userRepository;
    private final ListingFacade listingFacade;
    private final FeatureGateService featureGateService;
    private final DomainEventPublisher eventPublisher;

    public ApplicationResponse apply(UUID individualId, UUID individualUserId, ApplyRequest req) {
        if (!listingFacade.isListingActive(req.listingId()))
            throw new BusinessRuleException("Bu ilanın süresi doldu veya artık başvuruya kapalı.");
        if (applicationRepository.existsByListingIdAndIndividualId(req.listingId(), individualId))
            throw new BusinessRuleException("Bu ilana zaten başvurdunuz.");

        IndividualProfile individual = individualProfileRepository.findById(individualId)
            .orElseThrow(() -> new ResourceNotFoundException("Profil bulunamadı."));

        UUID businessId = listingFacade.getBusinessIdByListingId(req.listingId());
        UUID businessUserId = userRepository.findUserIdByBusinessProfileId(businessId);

        Application saved = applicationRepository.save(Application.builder()
            .listingId(req.listingId()).businessId(businessId)
            .individual(individual).coverLetter(req.coverLetter()).build());

        eventPublisher.publish(new ApplicationReceivedEvent(
            saved.getId(), req.listingId(), businessUserId, individualId, individualUserId));

        return ApplicationMapper.toResponse(saved);
    }

    public ApplicationResponse markUnderReview(UUID businessId, UUID applicationId) {
        Application app = findOwnedByBusiness(applicationId, businessId);
        long reviewCount = applicationRepository.countByListingIdAndStatus(
            app.getListingId(), ApplicationStatus.UNDER_REVIEW);
        featureGateService.checkLimit(businessId, FeatureKey.MAX_UNDER_REVIEW_PER_LISTING, (int) reviewCount);
        app.markUnderReview();
        return ApplicationMapper.toResponse(app);
    }

    public ApplicationResponse accept(UUID businessId, UUID applicationId) {
        Application app = findOwnedByBusiness(applicationId, businessId);
        app.accept();
        UUID businessUserId  = userRepository.findUserIdByBusinessProfileId(businessId);
        UUID individualUserId = userRepository.findUserIdByIndividualProfileId(app.getIndividual().getId());
        eventPublisher.publish(new ApplicationAcceptedEvent(
            app.getId(), app.getListingId(), businessId,
            app.getIndividual().getId(), businessUserId, individualUserId));
        return ApplicationMapper.toResponse(app);
    }

    public ApplicationResponse reject(UUID businessId, UUID applicationId) {
        Application app = findOwnedByBusiness(applicationId, businessId);
        UUID individualUserId = userRepository.findUserIdByIndividualProfileId(app.getIndividual().getId());
        app.reject();
        eventPublisher.publish(new ApplicationRejectedEvent(
            app.getId(), app.getListingId(), individualUserId));
        return ApplicationMapper.toResponse(app);
    }

    public ApplicationResponse submitSubmission(UUID individualId, UUID applicationId,
                                                 SubmitSubmissionRequest req) {
        Application app = applicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Başvuru bulunamadı."));
        if (!app.isOwnedBy(individualId))
            throw new ForbiddenException("Bu başvuruya erişim yetkiniz yok.");

        List<String> imageUrls = normalizeUploadPaths(req.imageUrls());
        List<String> attachmentUrls = normalizeUploadPaths(req.attachmentUrls());
        List<String> links = normalizeLinks(req.links());

        if (imageUrls.isEmpty() && attachmentUrls.isEmpty() && links.isEmpty()) {
            throw new BusinessRuleException("En az bir kanıt (fotoğraf, dosya veya bağlantı) gerekli.");
        }

        app.submitWork(req.description(), imageUrls, attachmentUrls, links);
        applicationRepository.save(app);

        publishSubmissionSubmittedEvent(app);

        return ApplicationMapper.toResponse(app);
    }

    private void publishSubmissionSubmittedEvent(Application app) {
        try {
            UUID businessUserId = userRepository.findUserIdByBusinessProfileId(app.getBusinessId());
            eventPublisher.publish(new ApplicationSubmissionSubmittedEvent(
                app.getId(), businessUserId, app.getIndividual().getId()));
        } catch (Exception ex) {
            log.warn("Submission notification skipped applicationId={}: {}", app.getId(), ex.getMessage());
        }
    }

    public ApplicationResponse approveSubmission(UUID applicationId, String reviewNote) {
        Application app = applicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Başvuru bulunamadı."));
        app.approveSubmission(reviewNote);

        UUID businessUserId = userRepository.findUserIdByBusinessProfileId(app.getBusinessId());
        UUID individualUserId = userRepository.findUserIdByIndividualProfileId(app.getIndividual().getId());
        eventPublisher.publish(new ApplicationSubmissionApprovedEvent(
            app.getId(), businessUserId, individualUserId));

        return ApplicationMapper.toResponse(app);
    }

    public ApplicationResponse rejectSubmission(UUID applicationId, String reviewNote) {
        Application app = applicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Başvuru bulunamadı."));
        app.rejectSubmission(reviewNote);

        UUID individualUserId = userRepository.findUserIdByIndividualProfileId(app.getIndividual().getId());
        eventPublisher.publish(new ApplicationSubmissionRejectedEvent(
            app.getId(), individualUserId, reviewNote));

        return ApplicationMapper.toResponse(app);
    }

    public void withdraw(UUID individualId, UUID applicationId) {
        Application app = applicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Başvuru bulunamadı."));
        if (!app.isOwnedBy(individualId))
            throw new ForbiddenException("Bu başvuruya erişim yetkiniz yok.");
        app.withdraw();
    }

    private Application findOwnedByBusiness(UUID applicationId, UUID businessId) {
        Application app = applicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Başvuru bulunamadı."));
        if (!app.getBusinessId().equals(businessId))
            throw new ForbiddenException("Bu başvuruya erişim yetkiniz yok.");
        return app;
    }

    private List<String> normalizeUploadPaths(List<String> urls) {
        if (urls == null) return List.of();
        return urls.stream()
            .map(this::normalizeUploadPath)
            .filter(path -> !path.isBlank())
            .toList();
    }

    private List<String> normalizeLinks(List<String> links) {
        if (links == null) return List.of();
        return links.stream()
            .map(link -> link != null ? link.trim() : "")
            .filter(link -> !link.isBlank())
            .map(link -> {
                if (!link.matches("(?i)^https?://\\S+$")) {
                    throw new BusinessRuleException("Geçersiz bağlantı: " + link);
                }
                return link;
            })
            .distinct()
            .toList();
    }

    private String normalizeUploadPath(String url) {
        if (url == null || url.isBlank()) return "";
        int index = url.indexOf("/uploads/");
        return index >= 0 ? url.substring(index) : url.trim();
    }
}
