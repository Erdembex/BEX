package com.takkas.modules.listing.api.dto;

import java.util.List;
import java.util.UUID;

public record SavedListingsResponse(List<UUID> listingIds) {}
