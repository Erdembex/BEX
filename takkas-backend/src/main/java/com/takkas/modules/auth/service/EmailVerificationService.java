package com.takkas.modules.auth.service;

import com.takkas.common.exception.BusinessRuleException;
import com.takkas.common.logging.LogMask;
import com.takkas.common.security.JwtTokenProvider;
import com.takkas.infrastructure.mail.MailService;
import com.takkas.modules.auth.api.dto.AuthResponse;
import com.takkas.modules.auth.api.dto.ResendVerificationRequest;
import com.takkas.modules.auth.api.dto.VerifyEmailRequest;
import com.takkas.modules.auth.domain.EmailVerificationToken;
import com.takkas.modules.auth.domain.RefreshToken;
import com.takkas.modules.auth.repository.EmailVerificationTokenRepository;
import com.takkas.modules.auth.repository.RefreshTokenRepository;
import com.takkas.modules.user.domain.*;
import com.takkas.modules.user.domain.enums.UserStatus;
import com.takkas.modules.user.domain.enums.UserType;
import com.takkas.modules.user.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailVerificationService {

    private static final int TOKEN_TTL_HOURS = 24;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final BusinessProfileRepository businessProfileRepository;
    private final IndividualProfileRepository individualProfileRepository;
    private final EmailVerificationTokenRepository verificationTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final MailService mailService;
    private final JwtTokenProvider tokenProvider;

    @Value("${app.dev.expose-email-verification-code:false}")
    private boolean exposeDevVerificationCode;

    @Transactional
    public Optional<String> sendVerificationCode(User user) {
        String token = generateVerificationCode();
        Instant expiresAt = Instant.now().plus(TOKEN_TTL_HOURS, ChronoUnit.HOURS);

        EmailVerificationToken verificationToken = verificationTokenRepository.save(
            EmailVerificationToken.builder()
                .user(user)
                .token(token)
                .expiresAt(expiresAt)
                .build()
        );

        verificationTokenRepository.invalidateOtherTokens(
            user.getId(), verificationToken.getId(), Instant.now());

        boolean mailSent = mailService.sendVerificationEmail(user.getEmail(), token);

        log.info("[EmailVerification] Kod oluşturuldu: email={} expires={} mailSent={}",
            LogMask.email(user.getEmail()), expiresAt, mailSent);
        if (exposeDevVerificationCode) {
            log.info("[EmailVerification] (dev) token={}", token);
        }

        if (exposeDevVerificationCode && !mailSent) {
            return Optional.of(token);
        }
        return Optional.empty();
    }

    @Transactional
    public AuthResponse verifyEmail(VerifyEmailRequest req) {
        User user = userRepository.findByEmail(req.email().trim())
            .orElseThrow(() -> new BusinessRuleException("Geçersiz veya süresi dolmuş doğrulama kodu."));

        if (user.isEmailVerified() && user.getStatus() == UserStatus.ACTIVE) {
            throw new BusinessRuleException("Bu e-posta adresi zaten doğrulanmış.");
        }

        String normalizedCode = req.code().trim().toUpperCase();
        EmailVerificationToken verificationToken = verificationTokenRepository.findByToken(normalizedCode)
            .orElseThrow(() -> new BusinessRuleException("Geçersiz veya süresi dolmuş doğrulama kodu."));

        if (!verificationToken.getUser().getId().equals(user.getId())) {
            throw new BusinessRuleException("Geçersiz veya süresi dolmuş doğrulama kodu.");
        }

        if (!verificationToken.isValid()) {
            throw new BusinessRuleException("Geçersiz veya süresi dolmuş doğrulama kodu.");
        }

        user.setEmailVerified(true);
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);

        verificationToken.setUsedAt(Instant.now());
        verificationTokenRepository.save(verificationToken);
        verificationTokenRepository.invalidateOtherTokens(
            user.getId(), verificationToken.getId(), Instant.now());

        UUID profileId = resolveProfileId(user);
        String accessToken = tokenProvider.generateAccessToken(user, profileId);
        String refreshToken = refreshTokenRepository.save(RefreshToken.builder()
            .user(user)
            .token(UUID.randomUUID().toString())
            .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
            .build()).getToken();

        return new AuthResponse(accessToken, refreshToken, user.getUserType().name(), profileId);
    }

    @Transactional
    public Optional<String> resendVerification(ResendVerificationRequest req) {
        Optional<User> userOpt = userRepository.findByEmail(req.email().trim());
        if (userOpt.isEmpty()) {
            return Optional.empty();
        }

        User user = userOpt.get();
        if (user.isEmailVerified()) {
            return Optional.empty();
        }

        return sendVerificationCode(user);
    }

    private UUID resolveProfileId(User user) {
        return switch (user.getUserType()) {
            case BUSINESS -> businessProfileRepository.findByUserId(user.getId())
                .map(BusinessProfile::getId).orElseThrow();
            case INDIVIDUAL -> individualProfileRepository.findByUserId(user.getId())
                .map(IndividualProfile::getId).orElseThrow();
            case ADMIN -> user.getId();
        };
    }

    private String generateVerificationCode() {
        final String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder code = new StringBuilder(8);
        for (int i = 0; i < 8; i++) {
            code.append(alphabet.charAt(RANDOM.nextInt(alphabet.length())));
        }
        return code.toString();
    }
}
