package com.takkas.modules.application.mapper;

import com.takkas.modules.application.api.dto.*;
import com.takkas.modules.application.domain.Application;
import com.takkas.modules.user.api.dto.IndividualProfileSummary;
import com.takkas.modules.user.domain.IndividualSkill;

import java.util.List;

public class ApplicationMapper {

    public static ApplicationResponse toResponse(Application a) {
        return new ApplicationResponse(
            a.getId(), a.getListingId(), null, null, null,
            a.getStatus(), a.getAppliedAt());
    }

    public static ApplicantResponse toApplicantResponse(Application a,
                                                          IndividualProfileSummary profile) {
        String excerpt = a.getCoverLetter() != null && a.getCoverLetter().length() > 120
            ? a.getCoverLetter().substring(0, 120) + "..." : a.getCoverLetter();
        return new ApplicantResponse(
            a.getId(), profile.id(), profile.fullName(), profile.avatarUrl(),
            profile.skills(), excerpt, a.getStatus(), a.getAppliedAt());
    }

    public static ApplicationDetailResponse toDetailResponse(Application a,
                                                               IndividualProfileSummary profile,
                                                               boolean feedbackSubmittedByMe) {
        return new ApplicationDetailResponse(
            a.getId(), profile.id(), profile.fullName(), profile.avatarUrl(),
            profile.city(), null, profile.skills(), profile.bio(),
            a.getCoverLetter(), a.getStatus(), a.getAppliedAt(),
            a.getSubmissionText(),
            a.getSubmissionImageUrls() != null ? a.getSubmissionImageUrls() : List.of(),
            a.getSubmissionAttachmentUrls() != null ? a.getSubmissionAttachmentUrls() : List.of(),
            a.getSubmissionLinks() != null ? a.getSubmissionLinks() : List.of(),
            a.getSubmittedAt(), a.getReviewNote(), a.getReviewedAt(),
            a.getListingId(), a.getBusinessId(), feedbackSubmittedByMe);
    }
}
