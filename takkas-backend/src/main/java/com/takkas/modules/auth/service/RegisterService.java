package com.takkas.modules.auth.service;

import com.takkas.common.exception.BusinessRuleException;
import com.takkas.modules.auth.api.dto.*;
import com.takkas.modules.subscription.service.SubscriptionService;
import com.takkas.modules.user.service.UserService;
import com.takkas.modules.user.domain.*;
import com.takkas.modules.user.domain.enums.*;
import com.takkas.modules.user.repository.*;
import com.takkas.infrastructure.geocoding.BusinessGeocodingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class RegisterService {

    private final UserRepository userRepository;
    private final BusinessProfileRepository businessProfileRepository;
    private final IndividualProfileRepository individualProfileRepository;
    private final SubscriptionService subscriptionService;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationService emailVerificationService;
    private final BusinessGeocodingService geocodingService;

    public RegisterPendingResponse registerBusiness(BusinessRegisterRequest req) {
        validateEmailUnique(req.email());
        validateBirthDate(req.birthDate());

        User user = userRepository.save(User.builder()
            .email(req.email())
            .passwordHash(passwordEncoder.encode(req.password()))
            .userType(UserType.BUSINESS)
            .status(UserStatus.PENDING_VERIFY)
            .emailVerified(false)
            .birthDate(req.birthDate())
            .gender(req.gender())
            .build());

        BusinessProfile profile = businessProfileRepository.save(
            BusinessProfile.builder()
                .user(user)
                .businessName(req.businessName())
                .category(req.category())
                .city(req.city())
                .district(req.district())
                .openAddress(req.openAddress().trim())
                .phone(req.phone())
                .build());

        geocodingService.applyGeocode(profile);
        businessProfileRepository.save(profile);

        subscriptionService.assignFreePlan(profile.getId());

        Optional<String> devCode = emailVerificationService.sendVerificationCode(user);
        return buildPendingResponse(user.getEmail(), devCode);
    }

    public RegisterPendingResponse registerIndividual(IndividualRegisterRequest req) {
        validateEmailUnique(req.email());
        validateBirthDate(req.birthDate());

        User user = userRepository.save(User.builder()
            .email(req.email())
            .passwordHash(passwordEncoder.encode(req.password()))
            .userType(UserType.INDIVIDUAL)
            .status(UserStatus.PENDING_VERIFY)
            .emailVerified(false)
            .birthDate(req.birthDate())
            .gender(req.gender())
            .build());

        IndividualProfile profile = IndividualProfile.builder()
            .user(user).fullName(req.fullName())
            .username(userService.resolveUniqueUsername(req.fullName()))
            .city(req.city()).district(req.district())
            .build();

        req.skills().forEach(skill ->
            profile.getSkills().add(new IndividualSkill(profile, skill)));

        individualProfileRepository.save(profile);

        Optional<String> devCode = emailVerificationService.sendVerificationCode(user);
        return buildPendingResponse(user.getEmail(), devCode);
    }

    private void validateEmailUnique(String email) {
        if (userRepository.existsByEmail(email))
            throw new BusinessRuleException("Bu e-posta adresi zaten kayıtlı.");
    }

    private void validateBirthDate(LocalDate birthDate) {
        int age = Period.between(birthDate, LocalDate.now()).getYears();
        if (age < 13) {
            throw new BusinessRuleException("Kayıt için en az 13 yaşında olmalısınız.");
        }
    }

    private RegisterPendingResponse buildPendingResponse(String email, Optional<String> devCode) {
        return new RegisterPendingResponse(
            email,
            "E-posta adresine doğrulama kodu gönderildi.",
            devCode.orElse(null)
        );
    }
}
