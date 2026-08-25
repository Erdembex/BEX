package com.takkas.infrastructure.push;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FcmTokenRepository extends JpaRepository<FcmToken, UUID> {

    @Query("SELECT f.token FROM FcmToken f WHERE f.userId = :userId AND f.isActive = true")
    List<String> findActiveTokensByUserId(@Param("userId") UUID userId);

    Optional<FcmToken> findByUserIdAndToken(UUID userId, String token);

    void deleteByToken(String token);

    void deleteByUserId(UUID userId);

    @Modifying
    @Query("DELETE FROM FcmToken f WHERE f.isActive = false AND f.updatedAt < :threshold")
    int deleteInactiveTokensOlderThan(@Param("threshold") Instant threshold);
}
