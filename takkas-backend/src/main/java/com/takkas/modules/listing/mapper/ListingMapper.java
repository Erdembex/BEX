package com.takkas.modules.listing.mapper;

import com.takkas.modules.listing.api.dto.*;
import com.takkas.modules.listing.domain.*;
import com.takkas.modules.listing.domain.enums.ListingStatus;

import java.util.List;

public class ListingMapper {

    public static ListingResponse toResponse(Listing l) {
        ListingReward r = l.getReward();
        return new ListingResponse(
            l.getId(), l.getBusiness().getId(),
            l.getBusiness().getBusinessName(), l.getBusiness().getLogoUrl(),
            l.getTitle(), l.getDescription(), l.getWeeklyHours(), l.getStatus(),
            l.getSkills().stream().map(ListingSkill::getSkill).toList(),
            r != null ? r.getRewardType() : null,
            r != null ? r.getQuantity() : null,
            r != null ? r.getUnit() : null,
            r != null ? r.getValidityDays() : null,
            r != null ? r.getDescription() : null,
            l.getViewCount(), l.getCreatedAt(), l.getExpiresAt(),
            l.getBusiness().isVerified(),
            null,
            0L);
    }

    public static ListingCardResponse toCardResponse(Listing l) {
        ListingReward r = l.getReward();
        return new ListingCardResponse(
            l.getId(),
            l.getBusiness().getId(),
            l.getBusiness().getBusinessName(),
            l.getBusiness().getLogoUrl(),
            l.getBusiness().getCategory() != null ? l.getBusiness().getCategory().name() : null,
            l.getBusiness().getCity(),
            l.getBusiness().getDistrict(),
            l.getTitle(),
            l.getSkills().stream().map(ListingSkill::getSkill).toList(),
            r != null ? r.getRewardType() : null,
            r != null ? r.getQuantity() : null,
            r != null ? r.getUnit() : null,
            r != null ? r.getDescription() : null,
            l.getStatus(),
            0L,
            0L,
            l.getCreatedAt(),
            l.getExpiresAt(),
            false,
            false,
            l.getBusiness().isVerified(),
            l.getBusiness().getLatitude(),
            l.getBusiness().getLongitude(),
            null,
            0L);
    }
}
