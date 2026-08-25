package com.takkas.modules.user.api;

import com.takkas.common.security.CurrentUser;
import com.takkas.common.security.UserPrincipal;
import com.takkas.modules.user.api.dto.AccountExportResponse;
import com.takkas.modules.user.api.dto.DeleteAccountRequest;
import com.takkas.modules.user.service.AccountDataExportService;
import com.takkas.modules.user.service.AccountDeletionService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Hesap", description = "Hesap silme ve kişisel veri ihracı (KVKK)")
@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
public class AccountController {

    private final AccountDeletionService accountDeletionService;
    private final AccountDataExportService accountDataExportService;

    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMyAccount(@CurrentUser UserPrincipal p,
                                @Valid @RequestBody DeleteAccountRequest req) {
        accountDeletionService.deleteOwnAccount(p.userId(), req);
    }

    @GetMapping("/me/export")
    public AccountExportResponse exportMyData(@CurrentUser UserPrincipal p) {
        return accountDataExportService.export(p.userId());
    }
}
