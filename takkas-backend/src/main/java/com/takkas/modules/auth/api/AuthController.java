package com.takkas.modules.auth.api;

import com.takkas.common.security.CurrentUser;
import com.takkas.common.security.UserPrincipal;
import com.takkas.modules.auth.api.dto.*;
import com.takkas.modules.auth.repository.RefreshTokenRepository;
import com.takkas.modules.auth.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@Tag(name = "Auth", description = "Kayıt, giriş, token yenileme")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final RegisterService registerService;
    private final LoginService loginService;
    private final TokenRefreshService tokenRefreshService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordService passwordService;
    private final PhoneVerificationService phoneVerificationService;
    private final EmailVerificationService emailVerificationService;

    @PostMapping("/register/business")
    @ResponseStatus(HttpStatus.CREATED)
    public RegisterPendingResponse registerBusiness(@Valid @RequestBody BusinessRegisterRequest req) {
        return registerService.registerBusiness(req);
    }

    @PostMapping("/register/individual")
    @ResponseStatus(HttpStatus.CREATED)
    public RegisterPendingResponse registerIndividual(@Valid @RequestBody IndividualRegisterRequest req) {
        return registerService.registerIndividual(req);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return loginService.login(req);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshTokenRequest req) {
        return tokenRefreshService.refresh(req.refreshToken());
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void logout(@CurrentUser UserPrincipal principal,
                       @Valid @RequestBody RefreshTokenRequest req) {
        refreshTokenRepository.findByToken(req.refreshToken())
            .ifPresent(rt -> {
                rt.setRevoked(true);
                refreshTokenRepository.save(rt);
            });
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ForgotPasswordResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        Optional<String> devToken = passwordService.requestPasswordReset(req);
        if (devToken.isPresent()) {
            return ResponseEntity.ok(new ForgotPasswordResponse(devToken.get()));
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        passwordService.resetPassword(req);
    }

    @PostMapping("/change-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@CurrentUser UserPrincipal principal,
                               @Valid @RequestBody ChangePasswordRequest req) {
        passwordService.changePassword(principal.userId(), req);
    }

    @PostMapping("/phone/send-code")
    public ResponseEntity<SendPhoneCodeResponse> sendPhoneCode(@CurrentUser UserPrincipal principal,
                              @Valid @RequestBody SendPhoneCodeRequest req) {
        Optional<String> devCode = phoneVerificationService.sendCode(principal.userId(), req);
        if (devCode.isPresent()) {
            return ResponseEntity.ok(new SendPhoneCodeResponse(devCode.get()));
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/phone/verify")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void verifyPhoneCode(@CurrentUser UserPrincipal principal,
                                @Valid @RequestBody VerifyPhoneCodeRequest req) {
        phoneVerificationService.verifyCode(principal.userId(), req);
    }

    @PostMapping("/verify-email")
    public AuthResponse verifyEmail(@Valid @RequestBody VerifyEmailRequest req) {
        return emailVerificationService.verifyEmail(req);
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<ResendVerificationResponse> resendVerification(
            @Valid @RequestBody ResendVerificationRequest req) {
        Optional<String> devCode = emailVerificationService.resendVerification(req);
        if (devCode.isPresent()) {
            return ResponseEntity.ok(new ResendVerificationResponse(devCode.get()));
        }
        return ResponseEntity.noContent().build();
    }
}
