package com.takkas.support;

import com.takkas.modules.auth.api.dto.AuthResponse;
import com.takkas.modules.auth.api.dto.BusinessRegisterRequest;
import com.takkas.modules.auth.api.dto.IndividualRegisterRequest;
import com.takkas.modules.auth.api.dto.LoginRequest;
import com.takkas.modules.auth.api.dto.RegisterPendingResponse;
import com.takkas.modules.auth.api.dto.ResendVerificationResponse;
import com.takkas.modules.auth.api.dto.VerifyEmailRequest;
import com.takkas.modules.complaint.api.dto.CreateComplaintRequest;
import com.takkas.modules.complaint.domain.enums.ComplaintReason;
import com.takkas.modules.listing.api.dto.CreateListingRequest;
import com.takkas.modules.listing.api.dto.ListingResponse;
import com.takkas.modules.application.api.dto.ApplyRequest;
import com.takkas.modules.application.api.dto.ApplicationResponse;
import com.takkas.modules.user.domain.enums.BusinessCategory;
import com.takkas.modules.user.domain.enums.Skill;
import com.takkas.modules.listing.domain.enums.RewardType;
import com.takkas.modules.listing.domain.enums.WeeklyHours;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.util.List;
import java.util.UUID;

public class ApiTestClient {

    private static final String TEST_PASSWORD = "TestPass1";

    private final WebTestClient client;

    ApiTestClient(WebTestClient webTestClient, int port) {
        this.client = webTestClient.mutate().baseUrl("http://localhost:" + port).build();
    }

    private static String unique(String suffix) {
        return suffix + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    private AuthResponse verifyRegisteredEmail(String email, RegisterPendingResponse pending) {
        String code = pending.devVerificationCode();
        if (code == null || code.isBlank()) {
            var resend = client.post()
                .uri("/api/auth/resend-verification")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(new com.takkas.modules.auth.api.dto.ResendVerificationRequest(email))
                .exchange()
                .expectStatus().isOk()
                .expectBody(ResendVerificationResponse.class)
                .returnResult()
                .getResponseBody();
            code = resend != null ? resend.devVerificationCode() : null;
        }
        if (code == null || code.isBlank()) {
            throw new IllegalStateException("E-posta doğrulama kodu alınamadı (test ortamı).");
        }
        return client.post()
            .uri("/api/auth/verify-email")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(new VerifyEmailRequest(email, code))
            .exchange()
            .expectStatus().isOk()
            .expectBody(AuthResponse.class)
            .returnResult()
            .getResponseBody();
    }

    public AuthResponse registerBusiness(String suffix) {
        String tag = unique(suffix);
        String email = "biz-" + tag + "@test.dev";
        RegisterPendingResponse pending = client.post()
            .uri("/api/auth/register/business")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(new BusinessRegisterRequest(
                email,
                TEST_PASSWORD,
                "Test Cafe " + suffix,
                BusinessCategory.CAFE,
                "Istanbul",
                "Kadikoy",
                "Moda Cad. No:12 Kadikoy Istanbul",
                "5550000000"))
            .exchange()
            .expectStatus().isCreated()
            .expectBody(RegisterPendingResponse.class)
            .returnResult()
            .getResponseBody();
        return verifyRegisteredEmail(email, pending);
    }

    public record RegistrationResult(AuthResponse auth, String email) {}

    public RegistrationResult registerIndividualTracked(String suffix) {
        String tag = unique(suffix);
        String email = "user-" + tag + "@test.dev";
        RegisterPendingResponse pending = client.post()
            .uri("/api/auth/register/individual")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(new IndividualRegisterRequest(
                email,
                TEST_PASSWORD,
                "Test User " + tag,
                "Istanbul",
                "Kadikoy",
                List.of(Skill.SOCIAL_MEDIA)))
            .exchange()
            .expectStatus().isCreated()
            .expectBody(RegisterPendingResponse.class)
            .returnResult()
            .getResponseBody();
        AuthResponse auth = verifyRegisteredEmail(email, pending);
        return new RegistrationResult(auth, email);
    }

    public RegistrationResult registerBusinessTracked(String suffix) {
        String tag = unique(suffix);
        String email = "biz-" + tag + "@test.dev";
        RegisterPendingResponse pending = client.post()
            .uri("/api/auth/register/business")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(new BusinessRegisterRequest(
                email,
                TEST_PASSWORD,
                "Test Cafe " + tag,
                BusinessCategory.CAFE,
                "Istanbul",
                "Kadikoy",
                "Moda Cad. No:12 Kadikoy Istanbul",
                "5550000000"))
            .exchange()
            .expectStatus().isCreated()
            .expectBody(RegisterPendingResponse.class)
            .returnResult()
            .getResponseBody();
        AuthResponse auth = verifyRegisteredEmail(email, pending);
        return new RegistrationResult(auth, email);
    }

    public AuthResponse registerIndividual(String suffix) {
        String tag = unique(suffix);
        String email = "user-" + tag + "@test.dev";
        RegisterPendingResponse pending = client.post()
            .uri("/api/auth/register/individual")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(new IndividualRegisterRequest(
                email,
                TEST_PASSWORD,
                "Test User " + suffix,
                "Istanbul",
                "Kadikoy",
                List.of(Skill.SOCIAL_MEDIA)))
            .exchange()
            .expectStatus().isCreated()
            .expectBody(RegisterPendingResponse.class)
            .returnResult()
            .getResponseBody();
        return verifyRegisteredEmail(email, pending);
    }

    public AuthResponse loginAdmin() {
        return client.post()
            .uri("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(new LoginRequest("admin@bex.dev", "Admin123!"))
            .exchange()
            .expectStatus().isOk()
            .expectBody(AuthResponse.class)
            .returnResult()
            .getResponseBody();
    }

    public ListingResponse createListing(String businessToken) {
        CreateListingRequest req = new CreateListingRequest(
            "Test gorev ilani basligi",
            "Bu test ilan aciklamasi en az yirmi karakter olmali ve gecerli bir icerik tasir.",
            WeeklyHours.H3_5,
            List.of(Skill.SOCIAL_MEDIA),
            new CreateListingRequest.RewardRequest(
                RewardType.COFFEE,
                1,
                "adet",
                30,
                "Test odulu"),
            null);

        return client.post()
            .uri("/api/business/listings")
            .headers(auth(businessToken))
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(req)
            .exchange()
            .expectStatus().isCreated()
            .expectBody(ListingResponse.class)
            .returnResult()
            .getResponseBody();
    }

    public ListingResponse approveListing(String adminToken, UUID listingId) {
        return client.patch()
            .uri("/api/admin/listings/{id}/approve", listingId)
            .headers(auth(adminToken))
            .exchange()
            .expectStatus().isOk()
            .expectBody(ListingResponse.class)
            .returnResult()
            .getResponseBody();
    }

    public ApplicationResponse apply(String individualToken, UUID listingId) {
        return client.post()
            .uri("/api/individual/applications")
            .headers(auth(individualToken))
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(new ApplyRequest(
                listingId,
                "Bu basvuru metni test icin en az elli karakter uzunlugunda yazilmistir ve gecerlidir."))
            .exchange()
            .expectStatus().isCreated()
            .expectBody(ApplicationResponse.class)
            .returnResult()
            .getResponseBody();
    }

    public ApplicationResponse markUnderReview(String businessToken, UUID applicationId) {
        return client.patch()
            .uri("/api/business/applications/{id}/review", applicationId)
            .headers(auth(businessToken))
            .exchange()
            .expectStatus().isOk()
            .expectBody(ApplicationResponse.class)
            .returnResult()
            .getResponseBody();
    }

    public ApplicationResponse acceptApplication(String businessToken, UUID applicationId) {
        markUnderReview(businessToken, applicationId);
        return client.patch()
            .uri("/api/business/applications/{id}/accept", applicationId)
            .headers(auth(businessToken))
            .exchange()
            .expectStatus().isOk()
            .expectBody(ApplicationResponse.class)
            .returnResult()
            .getResponseBody();
    }

    public void submitComplaint(String individualToken, UUID applicationId) {
        client.post()
            .uri("/api/individual/complaints")
            .headers(auth(individualToken))
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(new CreateComplaintRequest(
                applicationId,
                ComplaintReason.POOR_SERVICE,
                "Test sikayet aciklamasi en az on karakter olmalidir."))
            .exchange()
            .expectStatus().isOk();
    }

    public int countEligibleApplications(String individualToken) {
        return client.get()
            .uri("/api/individual/complaints/eligible-applications")
            .headers(auth(individualToken))
            .exchange()
            .expectStatus().isOk()
            .expectBodyList(com.takkas.modules.complaint.api.dto.ComplaintEligibleApplicationResponse.class)
            .returnResult()
            .getResponseBody()
            .size();
    }

    private static java.util.function.Consumer<HttpHeaders> auth(String token) {
        return headers -> headers.setBearerAuth(token);
    }
}
