package com.takkas.modules.auth.service;

import com.takkas.common.exception.BusinessRuleException;
import com.takkas.common.exception.ForbiddenException;
import com.takkas.common.security.JwtTokenProvider;
import com.takkas.modules.auth.api.dto.*;
import com.takkas.modules.auth.domain.RefreshToken;
import com.takkas.modules.auth.repository.RefreshTokenRepository;
import com.takkas.modules.user.domain.*;
import com.takkas.modules.user.domain.enums.*;
import com.takkas.modules.user.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class LoginService {

    private final UserRepository userRepository;
    private final BusinessProfileRepository businessProfileRepository;
    private final IndividualProfileRepository individualProfileRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
            .orElseThrow(() -> new BusinessRuleException("E-posta veya şifre hatalı."));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash()))
            throw new BusinessRuleException("E-posta veya şifre hatalı.");

        if (user.getStatus() == UserStatus.SUSPENDED)
            throw new ForbiddenException("Hesabınız askıya alınmış.");

        if (user.getStatus() == UserStatus.PENDING_VERIFY || !user.isEmailVerified())
            throw new BusinessRuleException("E-posta adresin henüz doğrulanmadı. Gelen kutunu kontrol et.");

        UUID profileId = resolveProfileId(user);
        String access  = tokenProvider.generateAccessToken(user, profileId);
        String refresh = refreshTokenRepository.save(RefreshToken.builder()
            .user(user).token(UUID.randomUUID().toString())
            .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
            .build()).getToken();

        return new AuthResponse(access, refresh, user.getUserType().name(), profileId);
    }

    private UUID resolveProfileId(User user) {
        return switch (user.getUserType()) {
            case BUSINESS   -> businessProfileRepository.findByUserId(user.getId())
                                .map(BusinessProfile::getId).orElseThrow();
            case INDIVIDUAL -> individualProfileRepository.findByUserId(user.getId())
                                .map(IndividualProfile::getId).orElseThrow();
            case ADMIN      -> user.getId();
        };
    }
}
