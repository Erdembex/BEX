import React, { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { Button } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { blockUserRequest, unblockUserRequest } from '@/features/user/userBlocksApi';
import { isBackendId } from '@/lib/api/backendId';
import { useAuthStore } from '@/store/authStore';

type Props = {
  targetUserId: string;
  displayName: string;
  initiallyBlocked?: boolean;
  variant?: 'outline' | 'ghost' | 'danger';
  compact?: boolean;
  onChanged?: (blocked: boolean) => void;
  onBlocked?: () => void;
};

export function BlockUserButton({
  targetUserId,
  displayName,
  initiallyBlocked = false,
  variant = 'outline',
  compact = false,
  onChanged,
  onBlocked,
}: Props) {
  const { t } = useTranslation();
  const sessionUserId = useAuthStore((s) => s.bexUser?.uid);
  const [blocked, setBlocked] = useState(initiallyBlocked);
  const [loading, setLoading] = useState(false);

  const showResult = useCallback(
    (message: string) => {
      Alert.alert(t('userBlock.blockTitle'), message, [{ text: 'Tamam' }]);
    },
    [t]
  );

  const run = useCallback(async () => {
    if (!targetUserId || targetUserId === sessionUserId) return;

    if (!blocked) {
      Alert.alert(
        t('userBlock.blockTitle'),
        t('userBlock.blockConfirm', { name: displayName }),
        [
          { text: t('userBlock.cancel'), style: 'cancel' },
          {
            text: t('userBlock.block'),
            style: 'destructive',
            onPress: () => {
              void (async () => {
                setLoading(true);
                try {
                  await blockUserRequest(targetUserId);
                  setBlocked(true);
                  onChanged?.(true);
                  onBlocked?.();
                  showResult(t('userBlock.blockedToast'));
                } catch (err: unknown) {
                  const message =
                    err instanceof Error ? err.message : t('userBlock.failed');
                  showResult(message);
                } finally {
                  setLoading(false);
                }
              })();
            },
          },
        ]
      );
      return;
    }

    setLoading(true);
    try {
      await unblockUserRequest(targetUserId);
      setBlocked(false);
      onChanged?.(false);
      showResult(t('userBlock.unblockedToast'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('userBlock.failed');
      showResult(message);
    } finally {
      setLoading(false);
    }
  }, [
    blocked,
    displayName,
    onBlocked,
    onChanged,
    sessionUserId,
    showResult,
    t,
    targetUserId,
  ]);

  if (!targetUserId || !isBackendId(targetUserId) || targetUserId === sessionUserId) {
    return null;
  }

  return (
    <Button
      title={blocked ? t('userBlock.unblock') : t('userBlock.block')}
      variant={blocked ? 'ghost' : variant}
      size={compact ? 'sm' : 'md'}
      fullWidth={!compact}
      onPress={run}
      loading={loading}
    />
  );
}
