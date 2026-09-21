package com.takkas.modules.media.service;

import com.takkas.common.exception.ForbiddenException;
import com.takkas.common.security.UserPrincipal;
import com.takkas.modules.application.repository.ApplicationRepository;
import com.takkas.modules.messaging.repository.MessageRepository;
import com.takkas.modules.user.domain.enums.UserType;
import com.takkas.modules.user.repository.BusinessProfileRepository;
import com.takkas.modules.user.repository.IndividualProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UploadAccessService {

    private final ApplicationRepository applicationRepository;
    private final MessageRepository messageRepository;
    private final IndividualProfileRepository individualProfileRepository;
    private final BusinessProfileRepository businessProfileRepository;

    public void verifyAccess(UserPrincipal principal, UUID ownerUserId, String filename) {
        if (principal.userId().equals(ownerUserId)) {
            return;
        }
        if (principal.userType() == UserType.ADMIN) {
            return;
        }

        String url = "/uploads/" + ownerUserId + "/" + filename;

        if (messageRepository.participantCanAccessMediaUrl(principal.userId(), url)) {
            return;
        }

        if (principal.userType() == UserType.BUSINESS
            && applicationRepository.businessCanAccessSubmissionImage(
                principal.profileId(), url, filename)) {
            return;
        }

        if (principal.userType() == UserType.BUSINESS
            && applicationRepository.businessHasApplicationWithUser(principal.profileId(), ownerUserId)
            && (individualProfileRepository.existsByUser_IdAndCvUrl(ownerUserId, url)
                || individualProfileRepository.existsByUser_IdAndCvUrlContaining(ownerUserId, filename))) {
            return;
        }

        if (applicationRepository.isPublicPortfolioImage(url, filename)) {
            return;
        }

        if (individualProfileRepository.existsByAvatarUrl(url)
            || businessProfileRepository.existsByLogoUrl(url)
            || businessProfileRepository.existsByVerificationDocumentUrl(url)) {
            return;
        }

        // DB'de tam URL saklanmış eski kayıtlar için
        String legacySuffix = ownerUserId + "/" + filename;
        if (individualProfileRepository.existsByAvatarUrlContaining(legacySuffix)
            || businessProfileRepository.existsByLogoUrlContaining(legacySuffix)
            || businessProfileRepository.existsByVerificationDocumentUrlContaining(legacySuffix)) {
            return;
        }

        throw new ForbiddenException("Bu dosyaya erişim yetkiniz yok.");
    }
}
