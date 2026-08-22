package com.takkas.modules.user.domain;

import com.takkas.modules.user.domain.enums.*;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users",
    uniqueConstraints = @UniqueConstraint(columnNames = "email"),
    indexes = @Index(name = "users_email_idx", columnList = "email"))
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserType userType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    @Column(length = 20)
    private String phone;

    @Column(nullable = false)
    @Builder.Default
    private boolean phoneVerified = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean emailVerified = false;

    @CreatedDate  private Instant createdAt;
    @LastModifiedDate private Instant updatedAt;
    private Instant deletedAt;
}
