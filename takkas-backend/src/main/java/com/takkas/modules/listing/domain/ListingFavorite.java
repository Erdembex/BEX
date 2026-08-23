package com.takkas.modules.listing.domain;

import com.takkas.modules.user.domain.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "listing_favorites",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_listing_favorite_user_listing",
        columnNames = {"user_id", "listing_id"}
    ),
    indexes = @Index(name = "listing_favorites_user_idx", columnList = "user_id, created_at")
)
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListingFavorite {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
