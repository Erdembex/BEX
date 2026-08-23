package com.takkas.modules.user.repository;

import com.takkas.modules.user.domain.BusinessProfile;
import com.takkas.modules.user.domain.enums.BusinessVerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BusinessProfileRepository extends JpaRepository<BusinessProfile, UUID> {
    Optional<BusinessProfile> findByUserId(UUID userId);

    List<BusinessProfile> findTop20ByBusinessNameContainingIgnoreCaseOrderByBusinessNameAsc(
        String businessName);

    List<BusinessProfile> findTop20ByOrderByBusinessNameAsc();

    List<BusinessProfile> findByVerificationStatusOrderByCreatedAtAsc(
        BusinessVerificationStatus verificationStatus);

    boolean existsByLogoUrl(String logoUrl);

    boolean existsByVerificationDocumentUrl(String verificationDocumentUrl);

    boolean existsByLogoUrlContaining(String suffix);

    boolean existsByVerificationDocumentUrlContaining(String suffix);

    List<BusinessProfile> findTop50ByLatitudeIsNullAndCityIsNotNullAndDistrictIsNotNull();
}
