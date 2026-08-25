package com.takkas.modules.admin.service;

import com.takkas.common.exception.BusinessRuleException;
import com.takkas.common.exception.ResourceNotFoundException;
import com.takkas.modules.listing.api.dto.ListingCardResponse;
import com.takkas.modules.listing.api.dto.ListingResponse;
import com.takkas.modules.listing.domain.Listing;
import com.takkas.modules.listing.domain.enums.ListingStatus;
import com.takkas.modules.listing.mapper.ListingMapper;
import com.takkas.modules.listing.repository.ListingRepository;
import com.takkas.modules.subscription.domain.enums.FeatureKey;
import com.takkas.modules.subscription.service.FeatureGateService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class AdminListingService {

    private final ListingRepository listingRepository;
    private final FeatureGateService featureGateService;

    @Transactional(readOnly = true)
    public List<ListingCardResponse> getPendingListings() {
        return listingRepository.findAllByStatusOrderByCreatedAtDesc(ListingStatus.DRAFT)
            .stream()
            .map(ListingMapper::toCardResponse)
            .toList();
    }

    public ListingResponse approveListing(UUID listingId) {
        Listing listing = listingRepository.findById(listingId)
            .orElseThrow(() -> new ResourceNotFoundException("İlan bulunamadı."));
        if (listing.getStatus() != ListingStatus.DRAFT) {
            throw new BusinessRuleException("Sadece taslak ilanlar onaylanabilir.");
        }
        UUID businessId = listing.getBusiness().getId();
        long activeCount = listingRepository.countByBusinessIdAndStatus(businessId, ListingStatus.ACTIVE);
        featureGateService.checkLimit(businessId, FeatureKey.MAX_ACTIVE_LISTINGS, (int) activeCount);
        listing.publish();
        return ListingMapper.toResponse(listing);
    }

    public void rejectListing(UUID listingId) {
        Listing listing = listingRepository.findById(listingId)
            .orElseThrow(() -> new ResourceNotFoundException("İlan bulunamadı."));
        if (listing.getStatus() != ListingStatus.DRAFT) {
            throw new BusinessRuleException("Sadece taslak ilanlar reddedilebilir.");
        }
        listingRepository.delete(listing);
    }
}
