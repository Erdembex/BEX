package com.takkas.modules.user.domain;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "user_blocks",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_user_block_pair",
        columnNames = {"blocker_user_id", "blocked_user_id"}
    ),
    indexes = {
        @Index(name = "user_blocks_blocker_idx", columnList = "blocker_user_id, created_at"),
        @Index(name = "user_blocks_blocked_idx", columnList = "blocked_user_id")
    }
)
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "blocker_user_id", nullable = false)
    private UUID blockerUserId;

    @Column(name = "blocked_user_id", nullable = false)
    private UUID blockedUserId;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
