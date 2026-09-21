package com.takkas.common.config;

import com.takkas.infrastructure.geocoding.BusinessGeocodingService;
import com.takkas.modules.user.domain.BusinessProfile;
import com.takkas.modules.user.repository.BusinessProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Eksik koordinatlı işletmeleri periyodik geocode eder (Nominatim ~1 istek/sn). */
@Component
@Profile("!test")
@RequiredArgsConstructor
@Slf4j
public class BusinessGeocodeScheduler {

    private final BusinessProfileRepository businessRepo;
    private final BusinessGeocodingService geocodingService;

    @Scheduled(fixedDelayString = "${app.geocode.backfill-delay-ms:3600000}")
    @Transactional
    public void backfillMissingCoordinates() {
        List<BusinessProfile> pending =
            businessRepo.findTop30ByLatitudeIsNullAndCityIsNotNullAndDistrictIsNotNull();
        if (pending.isEmpty()) {
            return;
        }

        log.info("Scheduled geocode: {} business profiles pending.", pending.size());
        int updated = 0;
        for (BusinessProfile profile : pending) {
            geocodingService.applyGeocode(profile);
            if (profile.getLatitude() != null && profile.getLongitude() != null) {
                businessRepo.save(profile);
                updated++;
            }
            try {
                Thread.sleep(1100L);
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        log.info("Scheduled geocode complete: {}/{} updated.", updated, pending.size());
    }
}
