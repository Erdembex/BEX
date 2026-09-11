package com.takkas.modules.user.api;

import com.takkas.common.security.CurrentUser;
import com.takkas.common.security.UserPrincipal;
import com.takkas.modules.user.api.dto.*;
import com.takkas.modules.user.service.BusinessAnalyticsService;
import com.takkas.modules.user.service.BusinessVerificationService;
import com.takkas.modules.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Kullanıcı Profil", description = "İşletme ve bireysel profil yönetimi")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final BusinessVerificationService businessVerificationService;
    private final BusinessAnalyticsService businessAnalyticsService;

    @GetMapping("/business/profile")
    public BusinessProfileResponse getBusinessProfile(@CurrentUser UserPrincipal p) {
        return userService.getBusinessProfile(p.profileId());
    }

    @PatchMapping("/business/profile")
    public BusinessProfileResponse updateBusinessProfile(@CurrentUser UserPrincipal p,
                                                         @Valid @RequestBody UpdateBusinessProfileRequest req) {
        return userService.updateBusinessProfile(p.profileId(), req);
    }

    @PostMapping("/business/verification")
    public BusinessProfileResponse submitBusinessVerification(@CurrentUser UserPrincipal p,
                                                              @Valid @RequestBody SubmitBusinessVerificationRequest req) {
        return businessVerificationService.submitVerification(p.profileId(), req);
    }

    @GetMapping("/business/analytics")
    @PreAuthorize("hasRole('BUSINESS')")
    public BusinessAnalyticsResponse getBusinessAnalytics(@CurrentUser UserPrincipal p) {
        return businessAnalyticsService.getSummary(p.profileId());
    }

    @GetMapping("/individual/profile")
    public IndividualProfileResponse getIndividualProfile(@CurrentUser UserPrincipal p) {
        return userService.getIndividualProfile(p.profileId());
    }

    @PatchMapping("/individual/profile")
    public IndividualProfileResponse updateIndividualProfile(@CurrentUser UserPrincipal p,
                                                              @Valid @RequestBody UpdateIndividualProfileRequest req) {
        return userService.updateIndividualProfile(p.profileId(), req);
    }

    /** Herkese açık bireysel profil — onaylı portföy görselleri ve tamamlanan görev sayısı */
    @GetMapping("/individual/profiles/{profileId}/public")
    @PreAuthorize("isAuthenticated()")
    public IndividualPublicProfileResponse getPublicProfile(@CurrentUser UserPrincipal viewer,
                                                            @PathVariable UUID profileId) {
        return userService.getPublicIndividualProfile(profileId, viewer.userId());
    }

    /** userId ile herkese açık profil (eski uid linkleri için) */
    @GetMapping("/users/{userId}/public-profile")
    @PreAuthorize("isAuthenticated()")
    public IndividualPublicProfileResponse getPublicProfileByUserId(@CurrentUser UserPrincipal viewer,
                                                                    @PathVariable UUID userId) {
        return userService.getPublicIndividualProfileByUserId(userId, viewer.userId());
    }

    /** Kullanıcı adı ile herkese açık profil — işletme aday araması */
    @GetMapping("/individual/profiles/by-username/{username}/public")
    @PreAuthorize("isAuthenticated()")
    public IndividualPublicProfileResponse getPublicProfileByUsername(@CurrentUser UserPrincipal viewer,
                                                                      @PathVariable String username) {
        return userService.getPublicIndividualProfileByUsername(username, viewer.userId());
    }

    /** Herkese açık işletme profili — kupon ve görev kartları için */
    @GetMapping("/business/profiles/{profileId}/public")
    @PreAuthorize("isAuthenticated()")
    public BusinessPublicProfileResponse getPublicBusinessProfile(@CurrentUser UserPrincipal viewer,
                                                                  @PathVariable UUID profileId) {
        return userService.getPublicBusinessProfile(profileId, viewer.userId());
    }

    /** Şikayet formu için işletme adı araması */
    @GetMapping("/business/profiles/search")
    @PreAuthorize("isAuthenticated()")
    public List<BusinessSearchResult> searchBusinessProfiles(@CurrentUser UserPrincipal viewer,
                                                             @RequestParam(required = false) String q) {
        return userService.searchBusinessProfiles(q, viewer.userId());
    }

    /** Kullanıcı adı / ad-soyad ile bireysel profil arama — oturum açmış herkes */
    @GetMapping("/individual/profiles/search")
    @PreAuthorize("isAuthenticated()")
    public List<IndividualSearchResult> searchIndividualProfilesPublic(@CurrentUser UserPrincipal viewer,
                                                                       @RequestParam(required = false) String q) {
        return userService.searchIndividualProfiles(q, viewer.userId());
    }

    /** İşletme — kullanıcı adı ile aday arama (şikayet formu) */
    @GetMapping("/business/individuals/search")
    @PreAuthorize("hasRole('BUSINESS')")
    public List<IndividualSearchResult> searchIndividualProfiles(@CurrentUser UserPrincipal viewer,
                                                                 @RequestParam(required = false) String q) {
        return userService.searchIndividualProfiles(q, viewer.userId());
    }
}
