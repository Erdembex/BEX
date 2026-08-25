package com.takkas.modules.user.api.dto;

import java.util.List;
import java.util.UUID;

public record IndividualPublicProfileResponse(
    UUID profileId,
    UUID userId,
    String username,
    String fullName,
    String avatarUrl,
    int completedTaskCount,
    double averageRating,
    long feedbackCount,
    long approvedComplaintCount,
    double complaintRate,
    boolean isDangerous,
    List<CompletedTaskResponse> completedTasks,
    List<PortfolioItemResponse> portfolioItems,
    String bio,
    String cvUrl) {}
