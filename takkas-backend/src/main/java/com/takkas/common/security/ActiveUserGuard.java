package com.takkas.common.security;

import com.takkas.common.exception.ForbiddenException;
import com.takkas.modules.user.domain.User;
import com.takkas.modules.user.domain.enums.UserStatus;
import com.takkas.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ActiveUserGuard {

    private final UserRepository userRepository;

    public User requireActiveUser(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ForbiddenException("Oturum geçersiz."));
        ensureActive(user);
        return user;
    }

    public void ensureActive(User user) {
        if (user.getStatus() == UserStatus.DELETED) {
            throw new ForbiddenException("Bu hesap silinmiş.");
        }
        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new ForbiddenException("Hesabınız askıya alınmış.");
        }
    }
}
