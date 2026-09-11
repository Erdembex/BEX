package com.takkas.modules.user;

import com.takkas.common.exception.ResourceNotFoundException;
import com.takkas.modules.user.api.dto.*;
import com.takkas.modules.user.domain.*;
import com.takkas.modules.user.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class UserFacade {

    private final BusinessProfileRepository businessRepo;
    private final IndividualProfileRepository individualRepo;
    private final UserRepository userRepository;

    public IndividualProfileSummary getIndividualSummary(UUID profileId) {
        IndividualProfile p = individualRepo.findById(profileId)
            .orElseThrow(() -> new ResourceNotFoundException("Profil bulunamadı."));
        return new IndividualProfileSummary(p.getId(), p.getFullName(), p.getAvatarUrl(),
            p.getCity(), p.getBio(),
            p.getSkills().stream().map(IndividualSkill::getSkill).toList());
    }

    public BusinessSummary getBusinessSummary(UUID profileId) {
        BusinessProfile p = businessRepo.findById(profileId)
            .orElseThrow(() -> new ResourceNotFoundException("İşletme bulunamadı."));
        return new BusinessSummary(p.getId(), p.getBusinessName(), p.getLogoUrl());
    }

    public UUID getUserIdByBusinessProfileId(UUID profileId) {
        return userRepository.findUserIdByBusinessProfileId(profileId);
    }

    public UUID getUserIdByIndividualProfileId(UUID profileId) {
        return userRepository.findUserIdByIndividualProfileId(profileId);
    }

    public UUID getBusinessProfileIdByUserId(UUID userId) {
        return businessRepo.findByUserId(userId)
            .map(BusinessProfile::getId)
            .orElseThrow(() -> new ResourceNotFoundException("İşletme profili bulunamadı."));
    }

    /** Push bildirimi ve sohbet listesi için görünen ad. */
    public String getDisplayNameForUserId(UUID userId) {
        return businessRepo.findByUserId(userId)
            .map(BusinessProfile::getBusinessName)
            .or(() -> individualRepo.findByUserId(userId).map(IndividualProfile::getFullName))
            .orElse("Kullanıcı");
    }
}
