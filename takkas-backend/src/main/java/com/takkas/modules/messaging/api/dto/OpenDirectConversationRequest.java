package com.takkas.modules.messaging.api.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record OpenDirectConversationRequest(@NotNull UUID individualUserId) {}
