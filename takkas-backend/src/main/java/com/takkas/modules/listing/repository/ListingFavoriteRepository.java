package com.takkas.modules.listing.repository;

import com.takkas.modules.listing.domain.ListingFavorite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ListingFavoriteRepository extends JpaRepository<ListingFavorite, UUID> {

    List<ListingFavorite> findByUser_IdOrderByCreatedAtDesc(UUID userId);

    Optional<ListingFavorite> findByUser_IdAndListing_Id(UUID userId, UUID listingId);

    boolean existsByUser_IdAndListing_Id(UUID userId, UUID listingId);

    void deleteByUser_IdAndListing_Id(UUID userId, UUID listingId);
}
