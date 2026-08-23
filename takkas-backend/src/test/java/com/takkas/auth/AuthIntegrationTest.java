package com.takkas.auth;

import com.takkas.modules.auth.api.dto.IndividualRegisterRequest;
import com.takkas.modules.auth.api.dto.LoginRequest;
import com.takkas.modules.user.domain.enums.Gender;
import com.takkas.modules.user.domain.enums.Skill;
import com.takkas.support.AbstractIntegrationTest;
import com.takkas.support.ApiTestClient.RegistrationResult;
import com.takkas.support.RequiresIntegrationInfrastructure;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@RequiresIntegrationInfrastructure
class AuthIntegrationTest extends AbstractIntegrationTest {

    @Test
    void registerIndividual_andLogin_returnsTokens() {
        RegistrationResult registered = api().registerIndividualTracked("a1");

        assertThat(registered.auth().accessToken()).isNotBlank();
        assertThat(registered.auth().refreshToken()).isNotBlank();
        assertThat(registered.auth().userType()).isEqualTo("INDIVIDUAL");
        assertThat(registered.auth().profileId()).isNotNull();

        webTestClient.post()
            .uri("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(new LoginRequest(registered.email(), "TestPass1"))
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.accessToken").isNotEmpty()
            .jsonPath("$.userType").isEqualTo("INDIVIDUAL");
    }

    @Test
    void registerBusiness_assignsFreePlan() {
        var registered = api().registerBusinessTracked("b1");

        assertThat(registered.auth().userType()).isEqualTo("BUSINESS");
        assertThat(registered.auth().profileId()).isNotNull();
    }

    @Test
    void duplicateEmailRegistration_returns422() {
        String email = "dup-" + UUID.randomUUID().toString().substring(0, 8) + "@test.dev";
        webTestClient.post()
            .uri("/api/auth/register/individual")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(new IndividualRegisterRequest(
                email,
                "TestPass1",
                "Duplicate User",
                "Istanbul",
                "Kadikoy",
                LocalDate.of(1990, 5, 20),
                Gender.FEMALE,
                List.of(Skill.SOCIAL_MEDIA)))
            .exchange()
            .expectStatus().isCreated();

        webTestClient.post()
            .uri("/api/auth/register/individual")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(new IndividualRegisterRequest(
                email,
                "TestPass1",
                "Duplicate User",
                "Istanbul",
                "Kadikoy",
                LocalDate.of(1990, 5, 20),
                Gender.FEMALE,
                List.of(Skill.SOCIAL_MEDIA)))
            .exchange()
            .expectStatus().isEqualTo(422)
            .expectBody()
            .jsonPath("$.code").isEqualTo("BUSINESS_RULE_VIOLATION");
    }

    @Test
    void loginWithWrongPassword_returns422() {
        var registered = api().registerBusinessTracked("badpw");

        webTestClient.post()
            .uri("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(new LoginRequest(registered.email(), "WrongPass1"))
            .exchange()
            .expectStatus().isEqualTo(422);
    }

    @Test
    void adminSeeder_canLogin() {
        var admin = api().loginAdmin();
        assertThat(admin.userType()).isEqualTo("ADMIN");
        assertThat(admin.accessToken()).isNotBlank();
    }
}
