package com.takkas.modules.listing.repository;

import com.takkas.modules.listing.domain.Listing;
import com.takkas.modules.listing.domain.enums.ListingStatus;
import com.takkas.modules.user.domain.enums.Skill;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ListingRepository extends JpaRepository<Listing, UUID> {

    List<Listing> findAllByBusinessIdOrderByCreatedAtDesc(UUID businessId);

    List<Listing> findAllByStatusOrderByCreatedAtDesc(ListingStatus status);

    long countByBusinessIdAndStatus(UUID businessId, ListingStatus status);

    boolean existsByIdAndBusinessId(UUID listingId, UUID businessId);

    @Query("""
        SELECT DISTINCT l FROM Listing l
        JOIN l.business b
        JOIN b.user u
        JOIN l.reward r
        LEFT JOIN l.skills s
        WHERE l.status = 'ACTIVE'
          AND b.businessName NOT LIKE 'Test Cafe%'
          AND u.email NOT LIKE '%@test.dev'
          AND (l.visibility IS NULL OR l.visibility = com.takkas.modules.listing.domain.enums.ListingVisibility.PUBLIC)
          AND (l.expiresAt IS NULL OR l.expiresAt > :now)
          AND (:city IS NULL OR b.city = :city)
          AND (:district IS NULL OR LOWER(TRIM(b.district)) = :district)
          AND (:#{#skills == null || #skills.isEmpty()} = true OR s.skill IN :skills)
          AND (:rewardType IS NULL OR r.rewardType = :rewardType)
          AND l.createdAt < :cursor
        ORDER BY l.createdAt DESC
        """)
    List<Listing> findActiveListingsForDiscover(
        @Param("city") String city,
        @Param("district") String district,
        @Param("skills") List<Skill> skills,
        @Param("rewardType") com.takkas.modules.listing.domain.enums.RewardType rewardType,
        @Param("now") Instant now,
        @Param("cursor") Instant cursor,
        Pageable pageable);

    @Query("""
        SELECT DISTINCT l FROM Listing l
        JOIN l.business b
        JOIN b.user u
        JOIN l.reward r
        LEFT JOIN l.skills s
        WHERE l.status = 'ACTIVE'
          AND b.businessName NOT LIKE 'Test Cafe%'
          AND u.email NOT LIKE '%@test.dev'
          AND (l.visibility IS NULL OR l.visibility = com.takkas.modules.listing.domain.enums.ListingVisibility.PUBLIC)
          AND (l.expiresAt IS NULL OR l.expiresAt > :now)
          AND (:city IS NULL OR b.city = :city)
          AND (:district IS NULL OR LOWER(TRIM(b.district)) = :district)
          AND (:#{#skills == null || #skills.isEmpty()} = true OR s.skill IN :skills)
          AND (:rewardType IS NULL OR r.rewardType = :rewardType)
          AND (LOWER(l.title) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(l.description) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(b.businessName) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(r.description) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(CAST(r.rewardType AS string)) LIKE LOWER(CONCAT('%', :q, '%')))
          AND l.createdAt < :cursor
        ORDER BY l.createdAt DESC
        """)
    List<Listing> searchActiveListingsForDiscover(
        @Param("city") String city,
        @Param("district") String district,
        @Param("skills") List<Skill> skills,
        @Param("rewardType") com.takkas.modules.listing.domain.enums.RewardType rewardType,
        @Param("q") String q,
        @Param("now") Instant now,
        @Param("cursor") Instant cursor,
        Pageable pageable);

    @Query("SELECT l FROM Listing l WHERE l.status = 'ACTIVE' AND l.expiresAt IS NOT NULL AND l.expiresAt < :now")
    List<Listing> findExpiredActiveListings(@Param("now") Instant now);

    @Modifying
    @Query("UPDATE Listing l SET l.viewCount = l.viewCount + :count WHERE l.id = :id")
    void incrementViewCount(@Param("id") UUID id, @Param("count") int count);
}
