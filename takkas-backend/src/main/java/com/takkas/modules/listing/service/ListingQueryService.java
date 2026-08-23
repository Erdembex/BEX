package com.takkas.modules.listing.service;

import com.takkas.common.exception.ResourceNotFoundException;
import com.takkas.common.pagination.PageResponse;
import com.takkas.modules.application.repository.ApplicationRepository;
import com.takkas.modules.complaint.domain.enums.ComplaintStatus;
import com.takkas.modules.complaint.repository.BusinessComplaintRepository;
import com.takkas.modules.complaint.service.TrustMetricsService;
import com.takkas.modules.feedback.service.FeedbackService;
import com.takkas.modules.listing.api.dto.*;
import com.takkas.modules.listing.domain.enums.ListingStatus;
import com.takkas.modules.listing.mapper.ListingMapper;
import com.takkas.modules.listing.repository.ListingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ListingQueryService {

    private final ListingRepository listingRepository;
    private final ListingCacheService cacheService;
    private final TrustMetricsService trustMetricsService;
    private final FeedbackService feedbackService;
    private final BusinessComplaintRepository businessComplaintRepository;
    private final ApplicationRepository applicationRepository;

    public List<ListingCardResponse> getBusinessListings(UUID businessId) {
        return enrichCards(listingRepository.findAllByBusinessIdOrderByCreatedAtDesc(businessId)
            .stream().map(ListingMapper::toCardResponse).toList());
    }

    public PageResponse<ListingCardResponse> discover(ListingFilterRequest filter) {
        int size = filter.pageSize() != null ? filter.pageSize() : 20;
        Instant now = Instant.now();
        Instant cursor = filter.cursor() != null ? filter.cursor() : now.plusSeconds(60);
        String city = blankToNull(filter.city());
        String district = normalizeDistrict(filter.district());
        String q = blankToNull(filter.q());
        var rewardType = filter.rewardType();
        var page = PageRequest.of(0, size);
        var listings = q == null
            ? listingRepository.findActiveListingsForDiscover(
                city, district, filter.skills(), rewardType, now, cursor, page)
            : listingRepository.searchActiveListingsForDiscover(
                city, district, filter.skills(), rewardType, q, now, cursor, page);
        var cards = enrichCards(listings.stream().map(ListingMapper::toCardResponse).toList());
        var nextCursor = listings.isEmpty() ? null : listings.getLast().getCreatedAt();
        return PageResponse.of(cards, nextCursor);
    }

    public ListingResponse getDetail(UUID listingId, boolean incrementView) {
        var listing = listingRepository.findById(listingId)
            .orElseThrow(() -> new ResourceNotFoundException("İlan bulunamadı."));
        if (listing.getStatus() == ListingStatus.DRAFT && !incrementView) {
            throw new ResourceNotFoundException("İlan bulunamadı.");
        }
        if (incrementView) cacheService.incrementViewCount(listingId);
        var response = ListingMapper.toResponse(listing);
        UUID businessId = listing.getBusiness().getId();
        var rating = feedbackService.batchBusinessRatings(List.of(businessId)).get(businessId);
        if (rating == null) {
            return response;
        }
        return new ListingResponse(
            response.id(),
            response.businessId(),
            response.businessName(),
            response.businessLogoUrl(),
            response.title(),
            response.description(),
            response.weeklyHours(),
            response.status(),
            response.skills(),
            response.rewardType(),
            response.rewardQuantity(),
            response.rewardUnit(),
            response.validityDays(),
            response.rewardDescription(),
            response.viewCount(),
            response.createdAt(),
            response.expiresAt(),
            response.businessVerified(),
            rating.averageStars(),
            rating.totalCount());
    }

    private List<ListingCardResponse> enrichCards(List<ListingCardResponse> cards) {
        if (cards.isEmpty()) return cards;
        var listingIds = cards.stream().map(ListingCardResponse::id).collect(Collectors.toSet());
        Map<UUID, Long> applicantCounts = toCountMap(
            applicationRepository.countActiveApplicantsByListingIds(listingIds));
        Map<UUID, Long> acceptedCounts = toCountMap(
            applicationRepository.countAcceptedApplicantsByListingIds(listingIds));

        var businessIds = cards.stream()
            .map(ListingCardResponse::businessProfileId)
            .filter(id -> id != null)
            .collect(Collectors.toSet());
        Map<UUID, TrustMetricsService.TrustMetrics> metrics =
            trustMetricsService.batchForBusinesses(businessIds);
        Map<UUID, FeedbackService.BusinessRatingSummary> ratings =
            feedbackService.batchBusinessRatings(businessIds);

        return cards.stream().map(card -> {
            UUID bizId = card.businessProfileId();
            var trust = bizId != null ? metrics.get(bizId) : null;
            var rating = bizId != null ? ratings.get(bizId) : null;
            boolean listed = bizId != null && businessComplaintRepository
                .existsByBusinessProfileIdAndStatus(bizId, ComplaintStatus.APPROVED);
            return new ListingCardResponse(
                card.id(),
                card.businessProfileId(),
                card.businessName(),
                card.businessLogoUrl(),
                card.businessCategory(),
                card.businessCity(),
                card.businessDistrict(),
                card.title(),
                card.skills(),
                card.rewardType(),
                card.rewardQuantity(),
                card.rewardUnit(),
                card.rewardDescription(),
                card.status(),
                applicantCounts.getOrDefault(card.id(), 0L),
                acceptedCounts.getOrDefault(card.id(), 0L),
                card.createdAt(),
                card.expiresAt(),
                listed,
                trust != null && trust.isDangerous(),
                card.businessVerified(),
                card.businessLatitude(),
                card.businessLongitude(),
                rating != null ? rating.averageStars() : card.businessAverageRating(),
                rating != null ? rating.totalCount() : card.businessFeedbackCount());
        }).toList();
    }

    private static Map<UUID, Long> toCountMap(List<Object[]> rows) {
        if (rows == null || rows.isEmpty()) return Map.of();
        return rows.stream().collect(Collectors.toMap(
            row -> (UUID) row[0],
            row -> (Long) row[1]
        ));
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    private static String normalizeDistrict(String value) {
        String trimmed = blankToNull(value);
        return trimmed != null ? trimmed.toLowerCase(Locale.ROOT) : null;
    }
}
