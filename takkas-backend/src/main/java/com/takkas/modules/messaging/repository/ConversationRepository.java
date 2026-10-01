package com.takkas.modules.messaging.repository;

import com.takkas.modules.messaging.domain.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConversationRepository extends JpaRepository<Conversation, UUID> {
    boolean existsByApplicationId(UUID applicationId);
    Optional<Conversation> findByApplicationId(UUID applicationId);

    Optional<Conversation> findByBusinessUserIdAndIndividualUserIdAndApplicationIdIsNull(
        UUID businessUserId, UUID individualUserId);

    @Query("SELECT c FROM Conversation c WHERE c.businessUserId = :uid OR c.individualUserId = :uid ORDER BY c.createdAt DESC")
    List<Conversation> findAllByParticipant(@Param("uid") UUID userId);

    @Query("SELECT COUNT(c) > 0 FROM Conversation c WHERE c.id = :cid AND (c.businessUserId = :uid OR c.individualUserId = :uid)")
    boolean isParticipant(@Param("cid") UUID conversationId, @Param("uid") UUID userId);
}
