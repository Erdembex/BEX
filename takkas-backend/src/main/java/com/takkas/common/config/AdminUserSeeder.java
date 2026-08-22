package com.takkas.common.config;

import com.takkas.modules.user.domain.User;
import com.takkas.modules.user.domain.enums.UserStatus;
import com.takkas.modules.user.domain.enums.UserType;
import com.takkas.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
@Order(2)
public class AdminUserSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.seed-enabled:true}")
    private boolean seedEnabled;

    @Value("${app.admin.email:admin@bex.dev}")
    private String adminEmail;

    @Value("${app.admin.password:Admin123!}")
    private String adminPassword;

    @Value("${app.admin.sync-password-on-startup:false}")
    private boolean syncPasswordOnStartup;

    @Override
    public void run(ApplicationArguments args) {
        if (!seedEnabled) return;

        userRepository.findByEmail(adminEmail).ifPresentOrElse(
            user -> {
                boolean changed = false;
                if (user.getUserType() != UserType.ADMIN) {
                    user.setUserType(UserType.ADMIN);
                    changed = true;
                    log.info("[AdminUserSeeder] Mevcut kullanıcı admin yapıldı: {}", adminEmail);
                }
                if (syncPasswordOnStartup && !passwordEncoder.matches(adminPassword, user.getPasswordHash())) {
                    user.setPasswordHash(passwordEncoder.encode(adminPassword));
                    changed = true;
                    log.info("[AdminUserSeeder] Admin şifresi yapılandırmayla eşitlendi: {}", adminEmail);
                }
                if (changed) userRepository.save(user);
            },
            () -> {
                userRepository.save(User.builder()
                    .email(adminEmail)
                    .passwordHash(passwordEncoder.encode(adminPassword))
                    .userType(UserType.ADMIN)
                    .status(UserStatus.ACTIVE)
                    .emailVerified(true)
                    .build());
                log.info("[AdminUserSeeder] Admin kullanıcı oluşturuldu: {}", adminEmail);
            }
        );
    }
}
