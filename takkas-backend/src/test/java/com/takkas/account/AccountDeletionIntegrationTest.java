package com.takkas.account;

import com.takkas.modules.auth.api.dto.LoginRequest;
import com.takkas.modules.user.api.dto.DeleteAccountRequest;
import com.takkas.support.AbstractIntegrationTest;
import com.takkas.support.ApiTestClient.RegistrationResult;
import com.takkas.support.RequiresIntegrationInfrastructure;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.util.function.Consumer;

@RequiresIntegrationInfrastructure
class AccountDeletionIntegrationTest extends AbstractIntegrationTest {

    private static Consumer<HttpHeaders> bearer(String token) {
        return headers -> headers.setBearerAuth(token);
    }

    @Test
    void exportReturnsOwnData() {
        RegistrationResult registered = api().registerIndividualTracked("export");

        webTestClient.get()
            .uri("/api/account/me/export")
            .headers(bearer(registered.auth().accessToken()))
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.account.email").isEqualTo(registered.email())
            .jsonPath("$.account.status").isEqualTo("ACTIVE")
            .jsonPath("$.individualProfile.fullName").isNotEmpty()
            .jsonPath("$.exportedAt").isNotEmpty();
    }

    @Test
    void deleteWithWrongPassword_keepsAccountUsable() {
        RegistrationResult registered = api().registerIndividualTracked("delwrongpw");

        webTestClient.method(org.springframework.http.HttpMethod.DELETE)
            .uri("/api/account/me")
            .headers(bearer(registered.auth().accessToken()))
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(new DeleteAccountRequest("WrongPass1", null))
            .exchange()
            .expectStatus().isEqualTo(422);

        webTestClient.get()
            .uri("/api/account/me/export")
            .headers(bearer(registered.auth().accessToken()))
            .exchange()
            .expectStatus().isOk();
    }

    @Test
    void deleteAnonymizesAccountAndBlocksFurtherAccess() {
        RegistrationResult registered = api().registerIndividualTracked("delete");
        String token = registered.auth().accessToken();

        webTestClient.method(org.springframework.http.HttpMethod.DELETE)
            .uri("/api/account/me")
            .headers(bearer(token))
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(new DeleteAccountRequest("TestPass1", "Test gerekçesi"))
            .exchange()
            .expectStatus().isNoContent();

        // Erişim jetonu hâlâ imza olarak geçerli ama hesap silindiği için reddedilir.
        webTestClient.get()
            .uri("/api/account/me/export")
            .headers(bearer(token))
            .exchange()
            .expectStatus().isForbidden();

        // Eski e-posta artık hiçbir hesaba ait değil.
        webTestClient.post()
            .uri("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(new LoginRequest(registered.email(), "TestPass1"))
            .exchange()
            .expectStatus().isEqualTo(422);
    }
}
