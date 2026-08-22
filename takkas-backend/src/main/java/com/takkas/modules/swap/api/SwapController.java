package com.takkas.modules.swap.api;

import com.takkas.common.pagination.PageResponse;
import com.takkas.common.security.*;
import com.takkas.modules.swap.api.dto.*;
import com.takkas.modules.swap.mapper.SwapMapper;
import com.takkas.modules.swap.repository.SwapTradeRepository;
import com.takkas.modules.swap.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.UUID;

@Tag(name = "Kupon Takası", description = "Swap marketplace — ilan ve teklif yönetimi")
@RestController
@RequiredArgsConstructor
public class SwapController {

    private final SwapListingService swapListingService;
    private final SwapOfferService swapOfferService;
    private final SwapTradeService swapTradeService;
    private final SwapTradeRepository swapTradeRepository;
    private final SwapOfferMessageService swapOfferMessageService;

    @PostMapping("/api/individual/swap-listings")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public SwapListingResponse createListing(@CurrentUser UserPrincipal p,
                                              @Valid @RequestBody CreateSwapListingRequest req) {
        return swapListingService.create(p.profileId(), req);
    }

    @GetMapping("/api/individual/swap-listings")
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public List<SwapListingResponse> getMyListings(@CurrentUser UserPrincipal p) {
        return swapListingService.getMyListings(p.profileId());
    }

    @DeleteMapping("/api/individual/swap-listings/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public void cancelListing(@CurrentUser UserPrincipal p, @PathVariable UUID id) {
        swapListingService.cancel(p.profileId(), id);
    }

    @GetMapping("/api/swap-listings")
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public PageResponse<SwapListingCardResponse> discover(@CurrentUser UserPrincipal p,
                                                           @ModelAttribute SwapDiscoverRequest req) {
        return swapListingService.discover(p.profileId(), req);
    }

    @GetMapping("/api/individual/swap-listings/{id}/offers")
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public List<SwapOfferResponse> getOffersForListing(@CurrentUser UserPrincipal p, @PathVariable UUID id) {
        return swapOfferService.getOffersForListing(p.profileId(), id);
    }

    @GetMapping("/api/individual/swap-offers")
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public List<SwapOfferResponse> getMyOffers(@CurrentUser UserPrincipal p) {
        return swapOfferService.getMyOffers(p.profileId());
    }

    @PostMapping("/api/swap-listings/{id}/offers")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public SwapOfferResponse sendOffer(@CurrentUser UserPrincipal p, @PathVariable UUID id,
                                        @Valid @RequestBody CreateSwapOfferRequest req) {
        return swapOfferService.sendOffer(p.profileId(), id, req);
    }

    @PatchMapping("/api/individual/swap-listings/{id}/offers/{offerId}/accept")
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public SwapTradeResponse acceptOffer(@CurrentUser UserPrincipal p,
                                          @PathVariable UUID id, @PathVariable UUID offerId) {
        return swapTradeService.acceptOffer(p.profileId(), id, offerId);
    }

    @PatchMapping("/api/individual/swap-listings/{id}/offers/{offerId}/reject")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public void rejectOffer(@CurrentUser UserPrincipal p,
                             @PathVariable UUID id, @PathVariable UUID offerId) {
        swapOfferService.rejectOffer(p.profileId(), id, offerId);
    }

    @GetMapping("/api/individual/swap-trades")
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public List<SwapTradeResponse> getMyTrades(@CurrentUser UserPrincipal p) {
        return swapTradeRepository.findAllByParticipant(p.profileId())
            .stream().map(SwapMapper::toTradeResponse).toList();
    }

    @GetMapping("/api/swap-offers/{offerId}/chat-context")
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public SwapOfferChatContextResponse getOfferChatContext(
        @CurrentUser UserPrincipal p,
        @PathVariable UUID offerId
    ) {
        return swapOfferMessageService.getChatContext(offerId, p);
    }

    @GetMapping("/api/swap-offers/{offerId}/messages")
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public List<SwapOfferMessageResponse> getOfferMessages(
        @CurrentUser UserPrincipal p,
        @PathVariable UUID offerId
    ) {
        return swapOfferMessageService.listMessages(offerId, p);
    }

    @PostMapping("/api/swap-offers/{offerId}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public SwapOfferMessageResponse sendOfferMessage(
        @CurrentUser UserPrincipal p,
        @PathVariable UUID offerId,
        @Valid @RequestBody CreateSwapOfferMessageRequest req
    ) {
        return swapOfferMessageService.sendMessage(offerId, p, req);
    }
}
