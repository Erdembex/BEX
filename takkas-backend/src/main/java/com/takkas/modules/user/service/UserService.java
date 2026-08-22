package com.takkas.modules.user.service;

import com.takkas.common.exception.BusinessRuleException;
import com.takkas.common.exception.ResourceNotFoundException;
import com.takkas.modules.complaint.service.ComplaintService;
import com.takkas.modules.complaint.service.TrustMetricsService;
import com.takkas.modules.feedback.service.FeedbackService;
import com.takkas.modules.application.domain.Application;
import com.takkas.modules.application.domain.enums.ApplicationStatus;
import com.takkas.modules.application.repository.ApplicationRepository;
import com.takkas.modules.listing.domain.enums.ListingStatus;
import com.takkas.modules.listing.repository.ListingRepository;
import com.takkas.modules.user.api.dto.*;
import com.takkas.modules.user.domain.*;
import com.takkas.modules.user.repository.*;
import com.takkas.modules.user.UsernameUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private static final EnumSet<ApplicationStatus> PORTFOLIO_STATUSES = EnumSet.of(
        ApplicationStatus.SUBMISSION_APPROVED, ApplicationStatus.REWARDED);

    private final BusinessProfileRepository businessRepo;
    private final IndividualProfileRepository individualRepo;
    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    private final ListingRepository listingRepository;
    private final ComplaintService complaintService;
    private final TrustMetricsService trustMetricsService;
    private final FeedbackService feedbackService;

    public BusinessProfileResponse getBusinessProfile(UUID profileId) {
        BusinessProfile p = businessRepo.findById(profileId)
            .orElseThrow(() -> new ResourceNotFoundException("İşletme profili bulunamadı."));
        return toResponse(p);
    }

    public IndividualProfileResponse getIndividualProfile(UUID profileId) {
        IndividualProfile p = individualRepo.findById(profileId)
            .orElseThrow(() -> new ResourceNotFoundException("Bireysel profil bulunamadı."));
        return toResponse(p);
    }

    public IndividualPublicProfileResponse getPublicIndividualProfile(UUID profileId) {
        IndividualProfile profile = individualRepo.findById(profileId)
            .orElseThrow(() -> new ResourceNotFoundException("Profil bulunamadı."));
        return buildPublicProfile(profile);
    }

    public IndividualPublicProfileResponse getPublicIndividualProfileByUserId(UUID userId) {
        IndividualProfile profile = individualRepo.findByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Profil bulunamadı."));
        return buildPublicProfile(profile);
    }

    public IndividualPublicProfileResponse getPublicIndividualProfileByUsername(String username) {
        String normalized = UsernameUtils.normalize(username);
        UsernameUtils.validate(normalized);
        IndividualProfile profile = individualRepo.findByUsernameIgnoreCase(normalized)
            .orElseThrow(() -> new ResourceNotFoundException("Profil bulunamadı."));
        return buildPublicProfile(profile);
    }

    public BusinessPublicProfileResponse getPublicBusinessProfile(UUID profileId) {
        BusinessProfile profile = businessRepo.findById(profileId)
            .orElseThrow(() -> new ResourceNotFoundException("İşletme bulunamadı."));
        UUID ownerUserId = userRepository.findUserIdByBusinessProfileId(profileId);
        if (ownerUserId == null) {
            throw new ResourceNotFoundException("İşletme sahibi bulunamadı.");
        }
        var feedback = feedbackService.getProfileFeedback(profileId, 1);
        var trust = trustMetricsService.getForBusiness(profileId);
        long activeListings = listingRepository.countByBusinessIdAndStatus(profileId, ListingStatus.ACTIVE);
        return new BusinessPublicProfileResponse(
            profile.getId(),
            ownerUserId,
            profile.getBusinessName(),
            profile.getLogoUrl(),
            profile.getCategory(),
            profile.getCity(),
            profile.getDistrict(),
            profile.getOpenAddress(),
            profile.isVerified(),
            complaintService.isBusinessListedInComplaintBex(profileId),
            feedback.averageStars(),
            feedback.totalCount(),
            trust.completedTaskCount(),
            trust.approvedComplaintCount(),
            trust.complaintRate(),
            activeListings,
            trust.isDangerous());
    }

    public List<IndividualSearchResult> searchIndividualProfiles(String query) {
        String term = query != null ? query.trim().replace("@", "") : "";
        List<IndividualProfile> profiles = term.length() >= 2
            ? individualRepo.findTop20ByUsernameContainingIgnoreCaseOrderByUsernameAsc(term)
            : individualRepo.findTop20ByOrderByUsernameAsc();
        return profiles.stream().map(p -> {
            var trust = trustMetricsService.getForIndividual(p.getId());
            return new IndividualSearchResult(
                p.getId(),
                p.getUsername(),
                p.getFullName(),
                p.getAvatarUrl(),
                (int) trust.completedTaskCount());
        }).toList();
    }

    public List<BusinessSearchResult> searchBusinessProfiles(String query) {
        String term = query != null ? query.trim() : "";
        List<BusinessProfile> profiles = term.length() >= 2
            ? businessRepo.findTop20ByBusinessNameContainingIgnoreCaseOrderByBusinessNameAsc(term)
            : businessRepo.findTop20ByOrderByBusinessNameAsc();
        return profiles.stream().map(this::toSearchResult).toList();
    }

    private BusinessSearchResult toSearchResult(BusinessProfile profile) {
        return new BusinessSearchResult(
            profile.getId(),
            profile.getBusinessName(),
            profile.getCategory() != null ? profile.getCategory().name() : null,
            profile.getCity(),
            profile.getDistrict(),
            profile.isVerified());
    }

    private IndividualPublicProfileResponse buildPublicProfile(IndividualProfile profile) {
        var applications = applicationRepository
            .findAllByIndividualIdAndStatusInOrderByReviewedAtDesc(
                profile.getId(), PORTFOLIO_STATUSES);

        var listingTitles = new HashMap<UUID, String>();
        for (Application app : applications) {
            listingTitles.computeIfAbsent(app.getListingId(), listingId ->
                listingRepository.findById(listingId)
                    .map(listing -> listing.getTitle())
                    .orElse("Görev"));
        }

        List<PortfolioItemResponse> portfolioItems = new ArrayList<>();
        List<CompletedTaskResponse> completedTasks = new ArrayList<>();
        for (Application app : applications) {
            String title = listingTitles.getOrDefault(app.getListingId(), "Görev");
            Instant approvedAt = app.getReviewedAt() != null
                ? app.getReviewedAt()
                : (app.getSubmittedAt() != null ? app.getSubmittedAt() : app.getAppliedAt());
            var images = app.getSubmissionImageUrls();
            String preview = images.isEmpty() ? null : images.get(0);
            completedTasks.add(new CompletedTaskResponse(
                app.getId(), title, approvedAt, images.size(), preview));
            for (int i = 0; i < images.size(); i++) {
                portfolioItems.add(new PortfolioItemResponse(
                    app.getId(), title, images.get(i), approvedAt));
            }
        }

        portfolioItems.sort(Comparator.comparing(
            PortfolioItemResponse::approvedAt,
            Comparator.nullsLast(Comparator.reverseOrder())));

        var feedback = feedbackService.getProfileFeedback(profile.getId(), 1);
        var trust = trustMetricsService.getForIndividual(profile.getId());

        return new IndividualPublicProfileResponse(
            profile.getId(),
            profile.getUsername(),
            profile.getFullName(),
            profile.getAvatarUrl(),
            applications.size(),
            feedback.averageStars(),
            feedback.totalCount(),
            trust.approvedComplaintCount(),
            trust.complaintRate(),
            trust.isDangerous(),
            completedTasks,
            portfolioItems,
            profile.getBio(),
            profile.getCvUrl());
    }

    public String resolveUniqueUsername(String baseName) {
        String base = UsernameUtils.slugFromFullName(baseName);
        if (base.length() < 3) {
            base = "user_" + base;
        }
        String candidate = base;
        int suffix = 0;
        while (individualRepo.existsByUsernameIgnoreCase(candidate)) {
            suffix++;
            String suffixText = "_" + suffix;
            int maxBaseLen = 30 - suffixText.length();
            String trimmedBase = base.length() > maxBaseLen ? base.substring(0, maxBaseLen) : base;
            candidate = trimmedBase + suffixText;
        }
        return candidate;
    }

    @Transactional
    public BusinessProfileResponse updateBusinessProfile(UUID profileId, UpdateBusinessProfileRequest req) {
        BusinessProfile p = businessRepo.findById(profileId)
            .orElseThrow(() -> new ResourceNotFoundException("İşletme profili bulunamadı."));
        p.setBusinessName(req.businessName());
        p.setCategory(req.category());
        p.setCity(req.city());
        p.setDistrict(req.district());
        if (req.openAddress() != null && !req.openAddress().isBlank()) {
            p.setOpenAddress(req.openAddress().trim());
        }
        p.setPhone(req.phone());
        p.setLogoUrl(req.logoUrl());
        p.setBio(req.bio());
        return toResponse(p);
    }

    @Transactional
    public IndividualProfileResponse updateIndividualProfile(UUID profileId, UpdateIndividualProfileRequest req) {
        IndividualProfile p = individualRepo.findById(profileId)
            .orElseThrow(() -> new ResourceNotFoundException("Bireysel profil bulunamadı."));
        String normalizedUsername = UsernameUtils.normalize(req.username());
        UsernameUtils.validate(normalizedUsername);
        if (!normalizedUsername.equalsIgnoreCase(p.getUsername())
            && individualRepo.existsByUsernameIgnoreCase(normalizedUsername)) {
            throw new BusinessRuleException("Bu kullanıcı adı zaten alınmış.");
        }
        p.setUsername(normalizedUsername);
        p.setFullName(req.fullName());
        p.setCity(req.city());
        p.setDistrict(req.district());
        p.setAvatarUrl(req.avatarUrl());
        p.setBio(req.bio());
        p.setCvUrl(req.cvUrl());
        syncSkills(p, req.skills());
        return toResponse(p);
    }

    private void syncSkills(IndividualProfile profile, List<com.takkas.modules.user.domain.enums.Skill> requestedSkills) {
        var requested = new LinkedHashSet<>(requestedSkills);
        profile.getSkills().removeIf(skill -> !requested.contains(skill.getSkill()));
        var existing = new HashSet<com.takkas.modules.user.domain.enums.Skill>();
        for (IndividualSkill skill : profile.getSkills()) {
            existing.add(skill.getSkill());
        }
        for (var skill : requested) {
            if (!existing.contains(skill)) {
                profile.getSkills().add(new IndividualSkill(profile, skill));
            }
        }
    }

    private BusinessProfileResponse toResponse(BusinessProfile p) {
        User user = p.getUser();
        return new BusinessProfileResponse(
            p.getId(),
            p.getBusinessName(),
            p.getCategory(),
            p.getCity(),
            p.getDistrict(),
            p.getOpenAddress(),
            p.getPhone(),
            p.getLogoUrl(),
            p.getBio(),
            p.isVerified(),
            p.getVerificationStatus(),
            p.getVerificationDocumentUrl(),
            p.getVerificationDocumentName(),
            user != null && user.isPhoneVerified()
        );
    }

    private IndividualProfileResponse toResponse(IndividualProfile p) {
        User user = p.getUser();
        return new IndividualProfileResponse(
            p.getId(), p.getUsername(), p.getFullName(), p.getCity(),
            p.getDistrict(), p.getAvatarUrl(), p.getBio(), p.getCvUrl(),
            p.getSkills().stream().map(IndividualSkill::getSkill).toList(),
            user != null ? user.getPhone() : null,
            user != null && user.isPhoneVerified());
    }
}
