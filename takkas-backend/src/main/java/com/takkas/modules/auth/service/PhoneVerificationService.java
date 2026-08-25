package com.takkas.modules.auth.service;

import com.takkas.common.exception.BusinessRuleException;
import com.takkas.common.logging.LogMask;
import com.takkas.modules.auth.api.dto.SendPhoneCodeRequest;
import com.takkas.modules.auth.api.dto.VerifyPhoneCodeRequest;
import com.takkas.modules.auth.domain.PhoneVerificationCode;
import com.takkas.modules.auth.repository.PhoneVerificationCodeRepository;
import com.takkas.modules.user.domain.User;
import com.takkas.modules.user.repository.UserRepository;
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
public class PhoneVerificationService {

    private static final int CODE_TTL_MINUTES = 10;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PhoneVerificationCodeRepository codeRepository;

    @Value("${app.dev.expose-phone-code:false}")
    private boolean exposeDevCode;

    @Transactional
    public Optional<String> sendCode(UUID userId, SendPhoneCodeRequest req) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessRuleException("Kullanıcı bulunamadı."));
        String phone = normalizePhone(req.phone());

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        Instant expiresAt = Instant.now().plus(CODE_TTL_MINUTES, ChronoUnit.MINUTES);

        PhoneVerificationCode entry = codeRepository.save(PhoneVerificationCode.builder()
            .user(user)
            .phone(phone)
            .code(code)
            .expiresAt(expiresAt)
            .build());

        codeRepository.invalidateOtherCodes(userId, entry.getId(), Instant.now());

        log.info("[PhoneVerify] Kod oluşturuldu: userId={} phone={} expires={}",
            userId, LogMask.phone(phone), expiresAt);
        if (exposeDevCode) {
            log.info("[PhoneVerify] (dev) code={}", code);
        }

        return exposeDevCode ? Optional.of(code) : Optional.empty();
    }

    @Transactional
    public void verifyCode(UUID userId, VerifyPhoneCodeRequest req) {
        String phone = normalizePhone(req.phone());
        String code = req.code().trim();

        PhoneVerificationCode entry = codeRepository
            .findTopByUserIdAndPhoneOrderByCreatedAtDesc(userId, phone)
            .orElseThrow(() -> new BusinessRuleException("Doğrulama kodu bulunamadı. Yeni kod iste."));

        if (!entry.isValid()) {
            throw new BusinessRuleException("Kod süresi dolmuş. Yeni kod iste.");
        }
        if (!entry.getCode().equals(code)) {
            throw new BusinessRuleException("Doğrulama kodu hatalı.");
        }

        entry.setVerifiedAt(Instant.now());
        User user = entry.getUser();
        user.setPhone(phone);
        user.setPhoneVerified(true);
        userRepository.save(user);
    }

    private String normalizePhone(String raw) {
        return raw.trim().replaceAll("[\\s()-]", "");
    }
}
