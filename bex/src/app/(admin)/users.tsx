import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { adminRepository } from '@/features/admin';
import { BexUser } from '@/types';
import { Input, Button } from '@/components/ui';
import { useToast } from '@/components/common/Toast';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

export default function AdminUsersScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const ROLE_LABELS: Record<BexUser['role'], string> = {
    user: t('adminUsersScreen.roleUser'),
    business: t('adminUsersScreen.roleBusiness'),
    admin: t('adminUsersScreen.roleAdmin'),
  };
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<BexUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionUid, setActionUid] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const list = await adminRepository.searchUsers(search);
    setUsers(list);
    setLoading(false);
  }, [search]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const toggleBan = (user: BexUser) => {
    const next = !user.isBanned;
    Alert.alert(
      next ? t('adminUsersScreen.suspendTitle') : t('adminUsersScreen.unsuspendTitle'),
      next
        ? t('adminUsersScreen.suspendBody', { name: user.displayName })
        : t('adminUsersScreen.unsuspendBody', { name: user.displayName }),
      [
        { text: t('adminUsersScreen.dismiss'), style: 'cancel' },
        {
          text: next ? t('adminUsersScreen.suspend') : t('adminUsersScreen.remove'),
          style: next ? 'destructive' : 'default',
          onPress: async () => {
            setActionUid(user.uid);
            try {
              await adminRepository.setUserBanned(user.uid, next);
              showToast(next ? t('adminUsersScreen.suspendedToast') : t('adminUsersScreen.unsuspendedToast'));
              await load();
            } catch {
              showToast(t('adminUsersScreen.actionFailedToast'));
            } finally {
              setActionUid(null);
            }
          },
        },
      ]
    );
  };

  return (
    <Screen style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>{t('adminUsersScreen.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('adminUsersScreen.title')}</Text>
      </View>

      <View style={styles.searchRow}>
        <Input
          placeholder={t('adminUsersScreen.searchPlaceholder')}
          value={search}
          onChangeText={setSearch}
          containerStyle={{ flex: 1 }}
        />
        <Button title={t('adminUsersScreen.search')} size="md" fullWidth={false} onPress={load} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>{t('adminUsersScreen.empty')}</Text>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, item.isBanned && styles.cardBanned]}>
              <View style={styles.cardTop}>
                <Text style={styles.name}>{item.displayName || '—'}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{ROLE_LABELS[item.role]}</Text>
                </View>
              </View>
              <Text style={styles.email}>{item.email || item.uid}</Text>
              <Text style={styles.meta}>
                {t('adminUsersScreen.taskCountLabel', { count: item.completedTaskCount ?? 0, score: item.reputationScore ?? 0 })}
              </Text>
              {item.isBanned ? (
                <Text style={styles.bannedLabel}>{t('adminUsersScreen.banned')}</Text>
              ) : null}
              {item.role !== 'admin' ? (
                <Button
                  title={item.isBanned ? t('adminUsersScreen.unsuspend') : t('adminUsersScreen.suspendAction')}
                  variant={item.isBanned ? 'outline' : 'danger'}
                  size="sm"
                  loading={actionUid === item.uid}
                  onPress={() => toggleBan(item)}
                  style={{ marginTop: Spacing[3] }}
                />
              ) : null}
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
  },
  back: { ...Typography.labelMedium, color: Colors.textSecondary },
  title: { ...Typography.headingMedium, color: Colors.textPrimary },
  searchRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    paddingHorizontal: Spacing[5],
    marginBottom: Spacing[3],
    alignItems: 'flex-start',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing[5], paddingTop: 0, gap: Spacing[3], flexGrow: 1 },
  empty: {
    ...Typography.bodyMedium,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingTop: Spacing[10],
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing[3],
  },
  cardBanned: { borderColor: Colors.error, opacity: 0.9 },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing[2],
  },
  name: { ...Typography.labelLarge, color: Colors.textPrimary, flex: 1 },
  roleBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  roleText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  email: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 4 },
  meta: { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing[1] },
  bannedLabel: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: '700',
    marginTop: Spacing[2],
  },
}));
