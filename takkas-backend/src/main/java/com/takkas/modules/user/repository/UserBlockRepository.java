package com.takkas.modules.user.repository;

import com.takkas.modules.user.domain.UserBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface UserBlockRepository extends JpaRepository<UserBlock, UUID> {

    boolean existsByBlockerUserIdAndBlockedUserId(UUID blockerUserId, UUID blockedUserId);

    List<UserBlock> findByBlockerUserIdOrderByCreatedAtDesc(UUID blockerUserId);

    void deleteByBlockerUserIdAndBlockedUserId(UUID blockerUserId, UUID blockedUserId);

    @Query("""
        SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END
        FROM UserBlock b
        WHERE (b.blockerUserId = :a AND b.blockedUserId = :b)
           OR (b.blockerUserId = :b AND b.blockedUserId = :a)
        """)
    boolean existsBlockBetween(@Param("a") UUID a, @Param("b") UUID b);

    /** Görüntüleyicinin engellediği veya engellendiği tüm kullanıcı kimlikleri. */
    @Query("""
        SELECT CASE WHEN b.blockerUserId = :viewerId THEN b.blockedUserId ELSE b.blockerUserId END
        FROM UserBlock b
        WHERE b.blockerUserId = :viewerId OR b.blockedUserId = :viewerId
        """)
    Set<UUID> findAllBlockedPeerUserIds(@Param("viewerId") UUID viewerId);

    @Query("SELECT b.blockedUserId FROM UserBlock b WHERE b.blockerUserId = :viewerId")
    Set<UUID> findBlockedUserIdsByBlocker(@Param("viewerId") UUID viewerId);
}
