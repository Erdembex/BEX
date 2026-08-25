import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Screen } from '@/components/common/Screen';
import { Button } from '@/components/ui';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';
import {
  BlockedUserDto,
  fetchBlockedUsersRequest,
  unblockUserRequest,
} from '@/features/user/userBlocksApi';

export default function BlockedUsersScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const [items, setItems] = useState<BlockedUserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await fetchBlockedUsersRequest());
    } catch (err: any) {
      setError(err?.message ?? t('userBlock.failed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const handleUnblock = (user: BlockedUserDto) => {
    Alert.alert(t('userBlock.unblock'), user.displayName, [
      { text: t('userBlock.cancel'), style: 'cancel' },
      {
        text: t('userBlock.unblock'),
        onPress: () => {
          void (async () => {
            setBusyId(user.userId);
            try {
              await unblockUserRequest(user.userId);
              setItems((prev) => prev.filter((x) => x.userId !== user.userId));
              Alert.alert(t('userBlock.unblockedToast'));
            } catch (err: any) {
              Alert.alert(err?.message ?? t('userBlock.failed'));
            } finally {
              setBusyId(null);
            }
          })();
        },
      },
    ]);
  };

  return (
    <Screen style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t('userBlock.blockedUsersTitle')}</Text>
        <Text style={styles.subtitle}>{t('userBlock.blockedUsersHint')}</Text>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing[6] }} />
        ) : error ? (
          <>
            <Text style={styles.error}>{error}</Text>
            <Button title={t('walletScreen.retry')} variant="outline" onPress={load} />
          </>
        ) : items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t('userBlock.blockedUsersEmpty')}</Text>
          </View>
        ) : (
          items.map((user) => (
            <View key={user.userId} style={styles.card}>
              <ProfileAvatar name={user.displayName} avatarUrl={user.avatarUrl ?? null} size={48} />
              <View style={styles.cardMeta}>
                <Text style={styles.name}>{user.displayName}</Text>
                <Text style={styles.type}>{user.userType}</Text>
              </View>
              <Button
                title={t('userBlock.unblock')}
                variant="ghost"
                onPress={() => handleUnblock(user)}
                loading={busyId === user.userId}
              />
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing[5], paddingBottom: Spacing[10], gap: Spacing[4] },
  back: { alignSelf: 'flex-start' },
  backText: { ...Typography.labelMedium, color: Colors.textSecondary },
  title: { ...Typography.headingLarge, color: Colors.textPrimary },
  subtitle: { ...Typography.bodyMedium, color: Colors.textSecondary, lineHeight: 22 },
  error: { ...Typography.bodySmall, color: Colors.error },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing[5],
    alignItems: 'center',
  },
  emptyText: { ...Typography.bodyMedium, color: Colors.textSecondary, textAlign: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing[4],
  },
  cardMeta: { flex: 1, gap: 2 },
  name: { ...Typography.labelLarge, color: Colors.textPrimary, fontWeight: '700' },
  type: { ...Typography.caption, color: Colors.textTertiary },
}));
