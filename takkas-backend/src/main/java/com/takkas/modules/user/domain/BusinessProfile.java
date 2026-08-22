package com.takkas.modules.user.domain;

import com.takkas.modules.user.domain.enums.BusinessCategory;
import com.takkas.modules.user.domain.enums.BusinessVerificationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "business_profiles")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class BusinessProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private String businessName;

    @Enumerated(EnumType.STRING)
    private BusinessCategory category;

    private String city;
    private String district;

    @Column(columnDefinition = "TEXT")
    private String openAddress;

    private String phone;
    private String logoUrl;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Builder.Default
    private boolean verified = false;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private BusinessVerificationStatus verificationStatus = BusinessVerificationStatus.NONE;

    private String verificationDocumentUrl;
    private String verificationDocumentName;

    @CreatedDate
    private Instant createdAt;
}
