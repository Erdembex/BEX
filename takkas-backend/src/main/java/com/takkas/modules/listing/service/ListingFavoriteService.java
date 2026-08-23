package com.takkas.modules.listing.service;

import com.takkas.common.exception.ResourceNotFoundException;
import com.takkas.modules.listing.api.dto.SavedListingsResponse;
import com.takkas.modules.listing.domain.ListingFavorite;
import com.takkas.modules.listing.repository.ListingFavoriteRepository;
import com.takkas.modules.listing.repository.ListingRepository;
import com.takkas.modules.user.domain.User;
import com.takkas.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ListingFavoriteService {

    private final ListingFavoriteRepository favoriteRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public SavedListingsResponse listForUser(UUID userId) {
        List<UUID> ids = favoriteRepository.findByUser_IdOrderByCreatedAtDesc(userId).stream()
            .map(f -> f.getListing().getId())
            .toList();
        return new SavedListingsResponse(ids);
    }

    @Transactional
    public void save(UUID userId, UUID listingId) {
        if (favoriteRepository.existsByUser_IdAndListing_Id(userId, listingId)) {
            return;
        }
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı."));
        var listing = listingRepository.findById(listingId)
            .orElseThrow(() -> new ResourceNotFoundException("İlan bulunamadı."));
        favoriteRepository.save(ListingFavorite.builder()
            .user(user)
            .listing(listing)
            .build());
    }

    @Transactional
    public void remove(UUID userId, UUID listingId) {
        favoriteRepository.deleteByUser_IdAndListing_Id(userId, listingId);
    }
}
