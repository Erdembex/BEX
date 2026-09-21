package com.takkas.modules.user.repository;

import com.takkas.modules.user.domain.IndividualProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IndividualProfileRepository extends JpaRepository<IndividualProfile, UUID> {
    Optional<IndividualProfile> findByUserId(UUID userId);

    Optional<IndividualProfile> findByUsernameIgnoreCase(String username);

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByUsernameIgnoreCaseAndIdNot(String username, UUID id);

    java.util.List<IndividualProfile> findTop20ByUsernameContainingIgnoreCaseOrderByUsernameAsc(String username);

    java.util.List<IndividualProfile> findTop20ByFullNameContainingIgnoreCaseOrderByFullNameAsc(String fullName);

    java.util.List<IndividualProfile> findTop20ByOrderByUsernameAsc();

    @Query("SELECT p.id AS id, p.fullName AS fullName FROM IndividualProfile p WHERE p.id IN :ids")
    List<IdAndFullName> findFullNamesByIds(@Param("ids") Collection<UUID> ids);

    boolean existsByAvatarUrl(String avatarUrl);

    boolean existsByAvatarUrlContaining(String suffix);

    boolean existsByUser_IdAndCvUrl(UUID userId, String cvUrl);

    boolean existsByUser_IdAndCvUrlContaining(UUID userId, String suffix);

    interface IdAndFullName {
        UUID getId();
        String getFullName();
    }
}
