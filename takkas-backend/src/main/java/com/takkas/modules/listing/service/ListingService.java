package com.takkas.modules.listing.service;

import com.takkas.common.exception.*;
import com.takkas.modules.listing.api.dto.*;
import com.takkas.modules.listing.domain.*;
import com.takkas.modules.listing.domain.enums.ListingStatus;
import com.takkas.modules.listing.mapper.ListingMapper;
import com.takkas.modules.listing.repository.ListingRepository;
import com.takkas.modules.subscription.domain.enums.FeatureKey;
import com.takkas.modules.subscription.service.FeatureGateService;
import com.takkas.modules.user.domain.BusinessProfile;
import com.takkas.modules.user.repository.BusinessProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class ListingService {

    private final ListingRepository listingRepository;
    private final BusinessProfileRepository businessProfileRepository;
    private final FeatureGateService featureGateService;

    @Value("${app.listings.auto-approve-on-create:true}")
    private boolean autoApproveOnCreate;

    public ListingResponse create(UUID businessId, CreateListingRequest req) {
        BusinessProfile business = businessProfileRepository.findById(businessId)
            .orElseThrow(() -> new ResourceNotFoundException("İşletme bulunamadı."));

        requireOpenAddress(business);

        Listing listing = Listing.builder()
            .business(business).title(req.title())
            .description(req.description()).weeklyHours(req.weeklyHours())
            .expiresAt(req.expiresAt()).build();

        req.skills().forEach(listing::addSkill);

        listing.setReward(ListingReward.builder()
            .rewardType(req.reward().rewardType())
            .quantity(req.reward().quantity())
            .unit(req.reward().unit())
            .validityDays(req.reward().validityDays())
            .description(req.reward().description())
            .build());

        if (autoApproveOnCreate) {
            long activeCount = listingRepository.countByBusinessIdAndStatus(businessId, ListingStatus.ACTIVE);
            featureGateService.checkLimit(businessId, FeatureKey.MAX_ACTIVE_LISTINGS, (int) activeCount);
        }

        listing = listingRepository.save(listing);

        if (autoApproveOnCreate) {
            listing.publish();
            listing = listingRepository.save(listing);
        }

        return ListingMapper.toResponse(listing);
    }

    public ListingResponse publish(UUID businessId, UUID listingId) {
        Listing listing = findOwned(listingId, businessId);
        if (listing.getStatus() != ListingStatus.DRAFT)
            throw new BusinessRuleException("Sadece taslak ilanlar yayınlanabilir.");
        long activeCount = listingRepository.countByBusinessIdAndStatus(businessId, ListingStatus.ACTIVE);
        featureGateService.checkLimit(businessId, FeatureKey.MAX_ACTIVE_LISTINGS, (int) activeCount);
        listing.publish();
        return ListingMapper.toResponse(listing);
    }

    public ListingResponse update(UUID businessId, UUID listingId, UpdateListingRequest req) {
        Listing listing = findOwned(listingId, businessId);
        if (listing.getStatus() == ListingStatus.CLOSED || listing.getStatus() == ListingStatus.EXPIRED)
            throw new BusinessRuleException("Kapalı veya süresi dolmuş ilan düzenlenemez.");
        listing.setTitle(req.title());
        listing.setDescription(req.description());
        if (req.weeklyHours() != null) listing.setWeeklyHours(req.weeklyHours());
        if (req.skills() != null) listing.updateSkills(req.skills());
        if (req.rewardType() != null)
            listing.getReward().update(req.rewardType(), req.quantity(), req.unit(), req.validityDays(), req.rewardDescription());
        return ListingMapper.toResponse(listing);
    }

    public void close(UUID businessId, UUID listingId) {
        findOwned(listingId, businessId).close();
    }

    private Listing findOwned(UUID listingId, UUID businessId) {
        Listing l = listingRepository.findById(listingId)
            .orElseThrow(() -> new ResourceNotFoundException("İlan bulunamadı."));
        if (!l.getBusiness().getId().equals(businessId))
            throw new ForbiddenException("Bu ilana erişim yetkiniz yok.");
        return l;
    }

    private void requireOpenAddress(BusinessProfile business) {
        String address = business.getOpenAddress();
        if (address == null || address.trim().length() < 10) {
            throw new BusinessRuleException(
                "Görev yayınlamak için işletme açık adresini profilinden eklemelisin.");
        }
    }
}
