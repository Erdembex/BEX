package com.takkas.modules.listing.api;

import com.takkas.common.pagination.PageResponse;
import com.takkas.common.security.CurrentUser;
import com.takkas.common.security.UserPrincipal;
import com.takkas.modules.listing.api.dto.*;
import com.takkas.modules.listing.service.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "İlanlar", description = "İlan oluşturma, yayınlama, keşfetme")
@RestController
@RequiredArgsConstructor
public class ListingController {

    private final ListingService listingService;
    private final ListingQueryService queryService;
    private final ListingFavoriteService favoriteService;

    @PostMapping("/api/business/listings")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('BUSINESS')")
    public ListingResponse create(@CurrentUser UserPrincipal p,
                                   @Valid @RequestBody CreateListingRequest req) {
        return listingService.create(p.profileId(), req);
    }

    @PutMapping("/api/business/listings/{id}")
    @PreAuthorize("hasRole('BUSINESS')")
    public ListingResponse update(@CurrentUser UserPrincipal p, @PathVariable UUID id,
                                   @Valid @RequestBody UpdateListingRequest req) {
        return listingService.update(p.profileId(), id, req);
    }

    @PatchMapping("/api/business/listings/{id}/close")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('BUSINESS')")
    public void close(@CurrentUser UserPrincipal p, @PathVariable UUID id) {
        listingService.close(p.profileId(), id);
    }

    @PatchMapping("/api/business/listings/{id}/publish")
    @PreAuthorize("hasRole('BUSINESS')")
    public ListingResponse publish(@CurrentUser UserPrincipal p, @PathVariable UUID id) {
        return listingService.publish(p.profileId(), id);
    }

    @GetMapping("/api/business/listings")
    @PreAuthorize("hasRole('BUSINESS')")
    public List<ListingCardResponse> getMyListings(@CurrentUser UserPrincipal p) {
        return queryService.getBusinessListings(p.profileId());
    }

    @GetMapping("/api/listings/favorites")
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public SavedListingsResponse getMyFavorites(@CurrentUser UserPrincipal p) {
        return favoriteService.listForUser(p.userId());
    }

    @PostMapping("/api/listings/{id}/favorite")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public void addFavorite(@CurrentUser UserPrincipal p, @PathVariable UUID id) {
        favoriteService.save(p.userId(), id);
    }

    @DeleteMapping("/api/listings/{id}/favorite")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public void removeFavorite(@CurrentUser UserPrincipal p, @PathVariable UUID id) {
        favoriteService.remove(p.userId(), id);
    }

    @GetMapping("/api/listings")
    public PageResponse<ListingCardResponse> discover(@ModelAttribute ListingFilterRequest filter) {
        return queryService.discover(filter);
    }

    @GetMapping("/api/listings/{id}")
    public ListingResponse getDetail(@PathVariable UUID id,
                                      @RequestHeader(value = "Authorization", required = false) String auth) {
        return queryService.getDetail(id, auth != null);
    }
}
