package com.takkas.admin;

import com.takkas.modules.auth.api.dto.AuthResponse;
import com.takkas.modules.listing.api.dto.ListingResponse;
import com.takkas.support.AbstractIntegrationTest;
import com.takkas.support.RequiresIntegrationInfrastructure;
import org.junit.jupiter.api.Test;

@RequiresIntegrationInfrastructure
class AdminStatsIntegrationTest extends AbstractIntegrationTest {

    @Test
    void platformStats_returnsAllSections() {
        AuthResponse admin = api().loginAdmin();

        webTestClient.get()
            .uri("/api/admin/stats")
            .headers(h -> h.setBearerAuth(admin.accessToken()))
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.generatedAt").exists()
            .jsonPath("$.users.total").isNumber()
            .jsonPath("$.users.activeLast7Days").isNumber()
            .jsonPath("$.listings.active").isNumber()
            .jsonPath("$.applications.completionRate").isNumber()
            .jsonPath("$.coupons.redemptionRate").isNumber()
            .jsonPath("$.swaps.completedTrades").isNumber()
            .jsonPath("$.engagement.averageRating").isNumber()
            .jsonPath("$.subscriptionPlans").isArray();
    }

    @Test
    void platformStats_reflectsNewlyCreatedListing() {
        AuthResponse business = api().registerBusiness("stats-biz");
        AuthResponse admin = api().loginAdmin();

        ListingResponse listing = api().createListing(business.accessToken());
        api().approveListing(admin.accessToken(), listing.id());

        webTestClient.get()
            .uri("/api/admin/stats")
            .headers(h -> h.setBearerAuth(admin.accessToken()))
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.listings.total").value(value -> {
                long total = ((Number) value).longValue();
                org.assertj.core.api.Assertions.assertThat(total).isGreaterThanOrEqualTo(1L);
            });
    }

    @Test
    void platformStats_deniedForNonAdmin() {
        AuthResponse individual = api().registerIndividual("stats-user");

        webTestClient.get()
            .uri("/api/admin/stats")
            .headers(h -> h.setBearerAuth(individual.accessToken()))
            .exchange()
            .expectStatus().isForbidden();
    }
}
