package com.takkas.modules.user.service;

import com.takkas.common.exception.BusinessRuleException;
import com.takkas.common.exception.ForbiddenException;
import com.takkas.common.exception.ResourceNotFoundException;
import com.takkas.modules.user.api.dto.BlockedUserResponse;
import com.takkas.modules.user.api.dto.BlockedUsersListResponse;
import com.takkas.modules.user.domain.User;
import com.takkas.modules.user.domain.UserBlock;
import com.takkas.modules.user.domain.enums.UserType;
import com.takkas.modules.user.repository.BusinessProfileRepository;
import com.takkas.modules.user.repository.IndividualProfileRepository;
import com.takkas.modules.user.repository.UserBlockRepository;
import com.takkas.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserBlockService {

    private final UserBlockRepository blockRepository;
    private final UserRepository userRepository;
    private final IndividualProfileRepository individualProfileRepository;
    private final BusinessProfileRepository businessProfileRepository;

    @Transactional
    public void block(UUID blockerUserId, UUID blockedUserId) {
        UUID resolvedBlockedUserId = resolveAuthUserId(blockedUserId);
        if (blockerUserId.equals(resolvedBlockedUserId)) {
            throw new BusinessRuleException("Kendinizi engelleyemezsiniz.");
        }
        if (blockRepository.existsByBlockerUserIdAndBlockedUserId(blockerUserId, resolvedBlockedUserId)) {
            return;
        }
        blockRepository.save(UserBlock.builder()
            .blockerUserId(blockerUserId)
            .blockedUserId(resolvedBlockedUserId)
            .build());
    }

    @Transactional
    public void unblock(UUID blockerUserId, UUID blockedUserId) {
        UUID resolvedBlockedUserId = resolveAuthUserId(blockedUserId);
        blockRepository.deleteByBlockerUserIdAndBlockedUserId(blockerUserId, resolvedBlockedUserId);
    }

    /** Mobil tarafta bazen profil UUID'si gelir; engelleme users.id ile yapılır. */
    private UUID resolveAuthUserId(UUID id) {
        if (userRepository.existsById(id)) {
            return id;
        }
        UUID fromIndividual = userRepository.findUserIdByIndividualProfileId(id);
        if (fromIndividual != null) {
            return fromIndividual;
        }
        UUID fromBusiness = userRepository.findUserIdByBusinessProfileId(id);
        if (fromBusiness != null) {
            return fromBusiness;
        }
        throw new ResourceNotFoundException("Kullanıcı bulunamadı.");
    }

    @Transactional(readOnly = true)
    public BlockedUsersListResponse listBlocked(UUID blockerUserId) {
        List<BlockedUserResponse> items = blockRepository
            .findByBlockerUserIdOrderByCreatedAtDesc(blockerUserId).stream()
            .map(block -> toResponse(block.getBlockedUserId(), block.getCreatedAt()))
            .toList();
        return new BlockedUsersListResponse(items);
    }

    @Transactional(readOnly = true)
    public boolean isBlockedEitherDirection(UUID userA, UUID userB) {
        if (userA == null || userB == null || userA.equals(userB)) {
            return false;
        }
        return blockRepository.existsBlockBetween(userA, userB);
    }

    /** Mesajlaşma ve profil erişimi için karşılıklı engel kontrolü. */
    public void ensureCanInteract(UUID viewerId, UUID targetUserId) {
        if (viewerId.equals(targetUserId)) {
            return;
        }
        if (isBlockedEitherDirection(viewerId, targetUserId)) {
            throw new ForbiddenException("Bu kullanıcıyla etkileşime geçemezsiniz.");
        }
    }

    @Transactional(readOnly = true)
    public Set<UUID> blockedPeerUserIds(UUID viewerId) {
        return blockRepository.findAllBlockedPeerUserIds(viewerId);
    }

    @Transactional(readOnly = true)
    public Set<UUID> blockedByViewerUserIds(UUID viewerId) {
        return blockRepository.findBlockedUserIdsByBlocker(viewerId);
    }

    @Transactional(readOnly = true)
    public boolean hasBlocked(UUID blockerUserId, UUID blockedUserId) {
        return blockRepository.existsByBlockerUserIdAndBlockedUserId(blockerUserId, blockedUserId);
    }

    private BlockedUserResponse toResponse(UUID userId, java.time.Instant blockedAt) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı."));
        if (user.getUserType() == UserType.BUSINESS) {
            var profile = businessProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("İşletme profili bulunamadı."));
            return new BlockedUserResponse(
                userId,
                profile.getBusinessName(),
                profile.getLogoUrl(),
                UserType.BUSINESS.name(),
                blockedAt);
        }
        var profile = individualProfileRepository.findByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Profil bulunamadı."));
        return new BlockedUserResponse(
            userId,
            profile.getFullName(),
            profile.getAvatarUrl(),
            UserType.INDIVIDUAL.name(),
            blockedAt);
    }
}
