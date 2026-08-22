package com.takkas.modules.user.service;

import com.takkas.common.event.BusinessVerificationApprovedEvent;
import com.takkas.common.event.BusinessVerificationRejectedEvent;
import com.takkas.common.event.BusinessVerificationSubmittedEvent;
import com.takkas.common.event.DomainEventPublisher;
import com.takkas.common.exception.BusinessRuleException;
import com.takkas.common.exception.ResourceNotFoundException;
import com.takkas.modules.user.api.dto.BusinessProfileResponse;
import com.takkas.modules.user.api.dto.PendingBusinessVerificationResponse;
import com.takkas.modules.user.api.dto.SubmitBusinessVerificationRequest;
import com.takkas.modules.user.domain.BusinessProfile;
import com.takkas.modules.user.domain.User;
import com.takkas.modules.user.domain.enums.BusinessVerificationStatus;
import com.takkas.modules.user.repository.BusinessProfileRepository;
import com.takkas.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BusinessVerificationService {

    private final BusinessProfileRepository businessRepo;
    private final UserRepository userRepository;
    private final DomainEventPublisher eventPublisher;

    @Transactional
    public BusinessProfileResponse submitVerification(UUID profileId, SubmitBusinessVerificationRequest req) {
        BusinessProfile profile = businessRepo.findById(profileId)
            .orElseThrow(() -> new ResourceNotFoundException("İşletme profili bulunamadı."));

        if (profile.getVerificationStatus() == BusinessVerificationStatus.VERIFIED) {
            throw new BusinessRuleException("İşletme zaten doğrulanmış.");
        }
        if (profile.getVerificationStatus() == BusinessVerificationStatus.PENDING) {
            throw new BusinessRuleException("Evrak incelemede. Yeni yükleme için admin yanıtını bekleyin.");
        }

        profile.setVerificationDocumentUrl(req.documentUrl().trim());
        profile.setVerificationDocumentName(
            req.documentName() != null && !req.documentName().isBlank()
                ? req.documentName().trim()
                : "Doğrulama evrakı"
        );
        profile.setVerificationStatus(BusinessVerificationStatus.PENDING);
        profile.setVerified(false);

        UUID businessUserId = userRepository.findUserIdByBusinessProfileId(profile.getId());
        eventPublisher.publish(new BusinessVerificationSubmittedEvent(
            profile.getId(), businessUserId, profile.getBusinessName()));

        return toResponse(profile);
    }

    @Transactional(readOnly = true)
    public List<PendingBusinessVerificationResponse> getPendingVerifications() {
        return businessRepo.findByVerificationStatusOrderByCreatedAtAsc(BusinessVerificationStatus.PENDING)
            .stream()
            .map(this::toPendingResponse)
            .toList();
    }

    @Transactional
    public BusinessProfileResponse approve(UUID profileId) {
        BusinessProfile profile = requirePending(profileId);
        profile.setVerificationStatus(BusinessVerificationStatus.VERIFIED);
        profile.setVerified(true);

        UUID businessUserId = userRepository.findUserIdByBusinessProfileId(profile.getId());
        eventPublisher.publish(new BusinessVerificationApprovedEvent(
            profile.getId(), businessUserId, profile.getBusinessName()));

        return toResponse(profile);
    }

    @Transactional
    public BusinessProfileResponse reject(UUID profileId) {
        BusinessProfile profile = requirePending(profileId);
        profile.setVerificationStatus(BusinessVerificationStatus.REJECTED);
        profile.setVerified(false);

        UUID businessUserId = userRepository.findUserIdByBusinessProfileId(profile.getId());
        eventPublisher.publish(new BusinessVerificationRejectedEvent(
            profile.getId(), businessUserId, profile.getBusinessName()));

        return toResponse(profile);
    }

    private BusinessProfile requirePending(BusinessProfile profile) {
        if (profile.getVerificationStatus() != BusinessVerificationStatus.PENDING) {
            throw new BusinessRuleException("Bu işletmenin bekleyen KYC evrakı yok.");
        }
        return profile;
    }

    private BusinessProfile requirePending(UUID profileId) {
        BusinessProfile profile = businessRepo.findById(profileId)
            .orElseThrow(() -> new ResourceNotFoundException("İşletme profili bulunamadı."));
        return requirePending(profile);
    }

    private PendingBusinessVerificationResponse toPendingResponse(BusinessProfile profile) {
        UUID ownerUserId = userRepository.findUserIdByBusinessProfileId(profile.getId());
        return new PendingBusinessVerificationResponse(
            profile.getId(),
            ownerUserId,
            profile.getBusinessName(),
            profile.getVerificationStatus(),
            profile.getVerificationDocumentUrl(),
            profile.getVerificationDocumentName()
        );
    }

    private BusinessProfileResponse toResponse(BusinessProfile profile) {
        User user = profile.getUser();
        return new BusinessProfileResponse(
            profile.getId(),
            profile.getBusinessName(),
            profile.getCategory(),
            profile.getCity(),
            profile.getDistrict(),
            profile.getOpenAddress(),
            profile.getPhone(),
            profile.getLogoUrl(),
            profile.getBio(),
            profile.isVerified(),
            profile.getVerificationStatus(),
            profile.getVerificationDocumentUrl(),
            profile.getVerificationDocumentName(),
            user != null && user.isPhoneVerified()
        );
    }
}
