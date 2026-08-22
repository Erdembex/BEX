package com.takkas.modules.media.service;

import com.takkas.common.exception.BusinessRuleException;
import com.takkas.common.exception.ResourceNotFoundException;
import com.takkas.infrastructure.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MediaStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
        "image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif");
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
        ".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif");
    private static final Set<String> BUSINESS_DOC_EXTENSIONS =
        Set.of(".jpg", ".jpeg", ".png", ".webp", ".pdf");
    private static final Set<String> BUSINESS_DOC_CONTENT_TYPES = Set.of(
        "image/jpeg", "image/png", "image/webp", "application/pdf");

    private static final Set<String> SUBMISSION_DOC_EXTENSIONS =
        Set.of(".jpg", ".jpeg", ".png", ".webp", ".pdf", ".doc", ".docx", ".zip", ".txt");
    private static final Set<String> SUBMISSION_DOC_CONTENT_TYPES = Set.of(
        "image/jpeg", "image/png", "image/webp", "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/zip", "application/x-zip-compressed", "text/plain");

    private final StorageService storageService;

    public List<String> storeUserFiles(UUID userId, MultipartFile[] files) {
        return storeFiles(userId, files, 5, this::validateImage, ALLOWED_EXTENSIONS);
    }

    /** KYC evrakları — JPG, PNG, WEBP ve PDF */
    public List<String> storeBusinessFiles(UUID userId, MultipartFile[] files) {
        return storeFiles(userId, files, 3, this::validateBusinessDocument, BUSINESS_DOC_EXTENSIONS);
    }

    /** Görev teslimi — fotoğraf dışı dosyalar (PDF, DOC, ZIP vb.) */
    public List<String> storeUserSubmissionDocuments(UUID userId, MultipartFile[] files) {
        return storeFiles(userId, files, 5, this::validateSubmissionDocument, SUBMISSION_DOC_EXTENSIONS);
    }

    /** Bireysel CV — yalnızca PDF, tek dosya */
    public String storeCvFile(UUID userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessRuleException("CV dosyası seçmelisin.");
        }
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new BusinessRuleException("CV en fazla 10 MB olabilir.");
        }
        return storeFiles(userId, new MultipartFile[] { file }, 1, this::validatePdf, Set.of(".pdf")).get(0);
    }

    private List<String> storeFiles(
        UUID userId,
        MultipartFile[] files,
        int maxCount,
        java.util.function.Consumer<MultipartFile> validator,
        Set<String> allowedExts
    ) {
        if (files == null || files.length == 0) {
            throw new BusinessRuleException("En az bir dosya seçmelisin.");
        }
        if (files.length > maxCount) {
            throw new BusinessRuleException(
                maxCount == 3 ? "En fazla 3 evrak yüklenebilir." : "En fazla 5 dosya yüklenebilir.");
        }

        List<String> urls = new ArrayList<>();
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) continue;
            validator.accept(file);
            String ext = extensionOf(file.getOriginalFilename(), file.getContentType(), allowedExts);
            String filename = UUID.randomUUID() + ext;
            String key = storageKey(userId, filename);
            try (InputStream in = file.getInputStream()) {
                storageService.store(key, in, file.getContentType(), file.getSize());
            } catch (IOException e) {
                log.error("Dosya kaydedilemedi userId={} key={}: {}", userId, key, e.getMessage());
                throw new BusinessRuleException("Dosya yüklenemedi.");
            }
            urls.add(publicPath(userId, filename));
        }

        if (urls.isEmpty()) {
            throw new BusinessRuleException("Geçerli dosya bulunamadı.");
        }
        return urls;
    }

    public Resource loadAsResource(UUID ownerUserId, String filename) {
        validateFilename(filename);
        String key = storageKey(ownerUserId, filename);
        if (!storageService.exists(key)) {
            throw new ResourceNotFoundException("Dosya bulunamadı.");
        }
        InputStream stream = storageService.open(key);
        return new InputStreamResource(stream);
    }

    public MediaType probeMediaType(String filename) {
        String lower = filename.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".pdf")) return MediaType.APPLICATION_PDF;
        if (lower.endsWith(".png")) return MediaType.IMAGE_PNG;
        if (lower.endsWith(".webp")) return MediaType.parseMediaType("image/webp");
        return MediaType.IMAGE_JPEG;
    }

    private static String storageKey(UUID userId, String filename) {
        return userId + "/" + filename;
    }

    private static String publicPath(UUID userId, String filename) {
        return "/uploads/" + userId + "/" + filename;
    }

    private static void validateFilename(String filename) {
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            throw new BusinessRuleException("Geçersiz dosya adı.");
        }
    }

    private void validateImage(MultipartFile file) {
        validateFile(file, ALLOWED_CONTENT_TYPES, ALLOWED_EXTENSIONS, "Yalnızca JPG, PNG veya WEBP yüklenebilir.");
    }

    private void validateBusinessDocument(MultipartFile file) {
        validateFile(file, BUSINESS_DOC_CONTENT_TYPES, BUSINESS_DOC_EXTENSIONS,
            "Yalnızca JPG, PNG, WEBP veya PDF yüklenebilir.");
    }

    private void validateSubmissionDocument(MultipartFile file) {
        validateFile(file, SUBMISSION_DOC_CONTENT_TYPES, SUBMISSION_DOC_EXTENSIONS,
            "Yalnızca JPG, PNG, WEBP, PDF, DOC, DOCX, ZIP veya TXT yüklenebilir.");
    }

    private void validatePdf(MultipartFile file) {
        validateFile(file, Set.of("application/pdf"), Set.of(".pdf"),
            "CV yalnızca PDF formatında olabilir.");
    }

    private void validateFile(MultipartFile file, Set<String> allowedTypes, Set<String> allowedExts, String message) {
        String ext = extensionOf(file.getOriginalFilename(), file.getContentType(), allowedExts).toLowerCase(Locale.ROOT);
        if (!allowedExts.contains(ext)) {
            throw new BusinessRuleException("Geçersiz dosya uzantısı.");
        }
        String contentType = resolveContentType(file.getContentType(), ext);
        if (!allowedTypes.contains(contentType)) {
            throw new BusinessRuleException(message);
        }
    }

    private String resolveContentType(String rawContentType, String ext) {
        if (rawContentType == null || rawContentType.isBlank()) {
            return mimeFromExtension(ext);
        }
        String lower = rawContentType.toLowerCase(Locale.ROOT);
        if ("application/octet-stream".equals(lower) || "binary/octet-stream".equals(lower)) {
            return mimeFromExtension(ext);
        }
        return lower;
    }

    private static String mimeFromExtension(String ext) {
        return switch (ext) {
            case ".zip" -> "application/zip";
            case ".pdf" -> "application/pdf";
            case ".doc" -> "application/msword";
            case ".docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case ".txt" -> "text/plain";
            case ".png" -> "image/png";
            case ".webp" -> "image/webp";
            case ".jpg", ".jpeg" -> "image/jpeg";
            default -> "application/octet-stream";
        };
    }

    private String extensionOf(String originalName, String contentType, Set<String> allowedExts) {
        if (originalName != null && originalName.contains(".")) {
            String ext = originalName.substring(originalName.lastIndexOf('.')).toLowerCase(Locale.ROOT);
            if (allowedExts.contains(ext)) {
                return ext;
            }
        }
        if (contentType != null && contentType.contains("pdf")) return ".pdf";
        if (contentType != null && contentType.contains("zip")) return ".zip";
        if (contentType != null && contentType.contains("plain")) return ".txt";
        if (contentType != null && contentType.contains("png")) return ".png";
        if (contentType != null && contentType.contains("webp")) return ".webp";
        return ".jpg";
    }
}
