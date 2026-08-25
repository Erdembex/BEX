package com.takkas.modules.user.api;

import com.takkas.common.security.CurrentUser;
import com.takkas.common.security.UserPrincipal;
import com.takkas.modules.user.api.dto.BlockedUsersListResponse;
import com.takkas.modules.user.service.UserBlockService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Tag(name = "Kullanıcı Engelleme", description = "Engelleme ve engellenenler listesi")
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserBlockController {

    private final UserBlockService userBlockService;

    @GetMapping("/blocks")
    @PreAuthorize("isAuthenticated()")
    public BlockedUsersListResponse listBlocked(@CurrentUser UserPrincipal viewer) {
        return userBlockService.listBlocked(viewer.userId());
    }

    @PostMapping("/{userId}/block")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("isAuthenticated()")
    public void blockUser(@CurrentUser UserPrincipal viewer, @PathVariable UUID userId) {
        userBlockService.block(viewer.userId(), userId);
    }

    @DeleteMapping("/{userId}/block")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("isAuthenticated()")
    public void unblockUser(@CurrentUser UserPrincipal viewer, @PathVariable UUID userId) {
        userBlockService.unblock(viewer.userId(), userId);
    }
}
