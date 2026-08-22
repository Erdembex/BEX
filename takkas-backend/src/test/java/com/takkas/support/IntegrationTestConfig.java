package com.takkas.support;

import com.takkas.modules.user.domain.User;
import com.takkas.modules.user.domain.enums.UserStatus;
import com.takkas.modules.user.domain.enums.UserType;
import com.takkas.modules.user.repository.UserRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;

@TestConfiguration
@Profile("test")
public class IntegrationTestConfig {

    @Bean
    @Order(100)
    ApplicationRunner ensureKnownTestAdmin(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> userRepository.findByEmail("admin@bex.dev").ifPresentOrElse(
            user -> {
                user.setUserType(UserType.ADMIN);
                user.setStatus(UserStatus.ACTIVE);
                user.setEmailVerified(true);
                user.setPasswordHash(passwordEncoder.encode("Admin123!"));
                userRepository.save(user);
            },
            () -> userRepository.save(User.builder()
                .email("admin@bex.dev")
                .passwordHash(passwordEncoder.encode("Admin123!"))
                .userType(UserType.ADMIN)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .build())
        );
    }
}
