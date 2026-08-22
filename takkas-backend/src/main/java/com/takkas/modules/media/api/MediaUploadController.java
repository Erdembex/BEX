package com.takkas.modules.media.api;

import com.takkas.common.security.CurrentUser;
import com.takkas.common.security.UserPrincipal;
import com.takkas.modules.media.api.dto.UploadResponse;
import com.takkas.modules.media.service.MediaStorageService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "Medya", description = "Dosya yükleme")
@RestController
@RequestMapping("/api/individual/uploads")
@RequiredArgsConstructor
public class MediaUploadController {

    private final MediaStorageService mediaStorageService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public UploadResponse upload(@CurrentUser UserPrincipal principal,
                                 @RequestParam("files") MultipartFile[] files) {
        return new UploadResponse(mediaStorageService.storeUserFiles(principal.userId(), files));
    }

    @PostMapping(value = "/submission", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public UploadResponse uploadSubmissionDocuments(@CurrentUser UserPrincipal principal,
                                                    @RequestParam("files") MultipartFile[] files) {
        return new UploadResponse(
            mediaStorageService.storeUserSubmissionDocuments(principal.userId(), files));
    }

    @PostMapping(value = "/cv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public UploadResponse uploadCv(@CurrentUser UserPrincipal principal,
                                   @RequestParam("file") MultipartFile file) {
        return new UploadResponse(java.util.List.of(
            mediaStorageService.storeCvFile(principal.userId(), file)));
    }
}
