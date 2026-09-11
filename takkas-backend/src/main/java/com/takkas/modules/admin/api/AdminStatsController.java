package com.takkas.modules.admin.api;

import com.takkas.modules.admin.api.dto.AdminPlatformStatsResponse;
import com.takkas.modules.admin.service.AdminStatsService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Admin İstatistik", description = "Platform geneli sayımlar (pilot takibi ve raporlama)")
@RestController
@RequestMapping("/api/admin/stats")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminStatsController {

    private final AdminStatsService adminStatsService;

    @GetMapping
    public AdminPlatformStatsResponse getPlatformStats() {
        return adminStatsService.getPlatformStats();
    }
}
