package com.takkas.modules.leaderboard.service;

import com.takkas.modules.application.repository.ApplicationRepository;
import com.takkas.modules.leaderboard.api.dto.LeaderboardEntryResponse;
import com.takkas.modules.user.domain.BusinessProfile;
import com.takkas.modules.user.domain.IndividualProfile;
import com.takkas.modules.user.repository.BusinessProfileRepository;
import com.takkas.modules.user.repository.IndividualProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class LeaderboardService {

    private final ApplicationRepository applicationRepository;
    private final IndividualProfileRepository individualProfileRepository;
    private final BusinessProfileRepository businessProfileRepository;

    public List<LeaderboardEntryResponse> topEarners(int limit) {
        int capped = Math.min(Math.max(limit, 1), 50);
        List<Object[]> rows = applicationRepository.findTopRewardedIndividuals(capped);
        if (rows.isEmpty()) return List.of();

        var ownerIds = rows.stream().map(r -> (UUID) r[0]).toList();
        Map<UUID, IndividualProfile> profiles = individualProfileRepository.findAllById(ownerIds)
            .stream().collect(Collectors.toMap(IndividualProfile::getId, p -> p));

        List<LeaderboardEntryResponse> result = new ArrayList<>();
        int rank = 1;
        for (Object[] row : rows) {
            UUID id = (UUID) row[0];
            long count = ((Number) row[1]).longValue();
            IndividualProfile p = profiles.get(id);
            if (p == null) continue;
            result.add(new LeaderboardEntryResponse(
                rank++,
                id,
                p.getFullName(),
                p.getCity() != null ? p.getCity() : "",
                count,
                p.getAvatarUrl()
            ));
        }
        return result;
    }

    public List<LeaderboardEntryResponse> topGivers(int limit) {
        int capped = Math.min(Math.max(limit, 1), 50);
        List<Object[]> rows = applicationRepository.findTopRewardingBusinesses(capped);
        if (rows.isEmpty()) return List.of();

        var businessIds = rows.stream().map(r -> (UUID) r[0]).toList();
        Map<UUID, BusinessProfile> profiles = businessProfileRepository.findAllById(businessIds)
            .stream().collect(Collectors.toMap(BusinessProfile::getId, p -> p));

        List<LeaderboardEntryResponse> result = new ArrayList<>();
        int rank = 1;
        for (Object[] row : rows) {
            UUID id = (UUID) row[0];
            long count = ((Number) row[1]).longValue();
            BusinessProfile p = profiles.get(id);
            if (p == null) continue;
            String location = p.getDistrict() != null && p.getCity() != null
                ? p.getDistrict() + ", " + p.getCity()
                : (p.getCity() != null ? p.getCity() : "");
            result.add(new LeaderboardEntryResponse(
                rank++,
                id,
                p.getBusinessName(),
                location,
                count,
                p.getLogoUrl()
            ));
        }
        return result;
    }
}
