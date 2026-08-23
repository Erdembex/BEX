package com.takkas.common.config;

import com.takkas.infrastructure.geocoding.BusinessGeocodingService;
import com.takkas.modules.user.domain.BusinessProfile;
import com.takkas.modules.user.repository.BusinessProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Eksik koordinatlı işletmeleri başlangıçta geocode eder (Nominatim rate limit: ~1/sn). */
@Component
@Profile("!test")
@RequiredArgsConstructor
@Slf4j
public class BusinessGeocodeBackfillRunner implements ApplicationRunner {

    private final BusinessProfileRepository businessRepo;
    private final BusinessGeocodingService geocodingService;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<BusinessProfile> pending = businessRepo.findTop50ByLatitudeIsNullAndCityIsNotNullAndDistrictIsNotNull();
        if (pending.isEmpty()) {
            return;
        }
        log.info("Geocoding {} business profiles missing coordinates...", pending.size());
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
        log.info("Business geocode backfill complete: {}/{} updated.", updated, pending.size());
    }
}
