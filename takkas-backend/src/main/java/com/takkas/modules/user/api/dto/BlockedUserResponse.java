package com.takkas.modules.user.api.dto;

import java.time.Instant;
import java.util.UUID;

public record BlockedUserResponse(
    UUID userId,
    String displayName,
    String avatarUrl,
    String userType,
    Instant blockedAt
) {}
