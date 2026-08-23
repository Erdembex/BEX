import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { router, Href } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { authService, getAuthErrorMessage } from '@/features/auth/authService';
import { hasRestAuthSession } from '@/lib/auth/sessionClaims';
import { getRestProfileId } from '@/lib/auth/sessionClaims';
import { BexUser } from '@/types';
import { Button, Input } from '@/components/ui';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { CompletedTasksModal } from '@/components/profile/CompletedTasksList';
import { LocationPicker } from '@/components/common/LocationPicker';
import { usersRepository } from '@/features/data';
import { CompletedTask } from '@/types';
import { useToast } from '@/components/common/Toast';
import { openProtectedMediaUrl } from '@/lib/openProtectedMedia';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

interface AccountSettingsProps {
  bexUser: BexUser | null;
  onUserUpdated: (user: BexUser | null) => void;
  showAdminLink?: boolean;
}

export function AccountSettings({
  bexUser,
  onUserUpdated,
  showAdminLink = true,
}: AccountSettingsProps) {
  const styles = useAccountSettingsStyles();
  const Colors = useThemeColors();
  const { t } = useTranslation();
  const ROLE_LABELS = {
    user: t('accountSettings.roleUser'),
    business: t('accountSettings.roleBusiness'),
    admin: t('accountSettings.roleAdmin'),
  } as const;
  const { firebaseUser } = useAuthStore();
  const { showToast } = useToast();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(bexUser?.displayName ?? '');
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState(bexUser?.username ?? '');
  const [savingName, setSavingName] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [myCompletedTasks, setMyCompletedTasks] = useState<CompletedTask[]>([]);
  const [editingPassword, setEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [restMode, setRestMode] = useState(false);
  const [locationCity, setLocationCity] = useState(bexUser?.city ?? 'İstanbul');
  const [locationDistrict, setLocationDistrict] = useState(bexUser?.district ?? '');
  const [editingLocation, setEditingLocation] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [bioDraft, setBioDraft] = useState(bexUser?.bio ?? '');
  const [editingBio, setEditingBio] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [removingCv, setRemovingCv] = useState(false);

  useEffect(() => {
    hasRestAuthSession().then(setRestMode);
  }, []);

  useEffect(() => {
    if (bexUser?.city) setLocationCity(bexUser.city);
    if (bexUser?.district) setLocationDistrict(bexUser.district);
    if (!editingBio) setBioDraft(bexUser?.bio ?? '');
  }, [bexUser?.city, bexUser?.district, bexUser?.bio, editingBio]);

  const handlePickAvatar = async () => {
    if (!firebaseUser) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('accountSettings.permissionRequiredTitle'), t('accountSettings.permissionRequiredBody'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setUploadingAvatar(true);
    try {
      const updated = await authService.updateAvatar(
        firebaseUser.uid,
        asset.uri,
        asset.mimeType ?? 'image/jpeg',
        asset.fileName ?? 'avatar.jpg'
      );
      onUserUpdated(updated);
      showToast(t('accountSettings.avatarUpdated'));
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : t('accountSettings.avatarUploadFailed');
      showToast(message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveName = async () => {
    if (!firebaseUser) return;
    setSavingName(true);
    try {
      const updated = await authService.updateDisplayName(firebaseUser.uid, nameDraft);
      onUserUpdated(updated);
      setEditingName(false);
      showToast(t('accountSettings.nameUpdated'));
    } catch {
      showToast(t('accountSettings.nameUpdateFailed'));
    } finally {
      setSavingName(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!firebaseUser) return;
    setSavingUsername(true);
    try {
      const updated = await authService.updateUsername(firebaseUser.uid, usernameDraft);
      onUserUpdated(updated);
      setEditingUsername(false);
      showToast(t('accountSettings.usernameUpdated'));
    } catch (error) {
      const code = (error as { code?: string }).code;
      const message = code
        ? getAuthErrorMessage(code)
        : error instanceof Error && error.message
          ? error.message
          : t('accountSettings.usernameUpdateFailed');
      showToast(message);
    } finally {
      setSavingUsername(false);
    }
  };

  const handleSaveLocation = async () => {
    setSavingLocation(true);
    try {
      const updated = await authService.updateIndividualLocation(locationCity, locationDistrict);
      onUserUpdated(updated);
      setEditingLocation(false);
      showToast(t('accountSettings.locationUpdated'));
    } catch (error) {
      const code = (error as { code?: string }).code;
      const message = code
        ? getAuthErrorMessage(code)
        : error instanceof Error && error.message
          ? error.message
          : t('accountSettings.locationUpdateFailed');
      showToast(message);
    } finally {
      setSavingLocation(false);
    }
  };

  const handleSaveBio = async () => {
    setSavingBio(true);
    try {
      const updated = await authService.updateBio(bioDraft);
      onUserUpdated(updated);
      setEditingBio(false);
      showToast(t('accountSettings.bioUpdated'));
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : t('accountSettings.bioUpdateFailed');
      showToast(message);
    } finally {
      setSavingBio(false);
    }
  };

  const handlePickCv = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setUploadingCv(true);
    try {
      const updated = await authService.uploadCv(asset.uri, asset.name ?? 'cv.pdf');
      onUserUpdated(updated);
      showToast(t('accountSettings.cvUploaded'));
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : t('accountSettings.cvUploadFailed');
      showToast(message);
    } finally {
      setUploadingCv(false);
    }
  };

  const handleRemoveCv = () => {
    Alert.alert(
      t('accountSettings.removeCvTitle'),
      t('accountSettings.removeCvBody'),
      [
        { text: t('accountSettings.cancel'), style: 'cancel' },
        {
          text: t('accountSettings.removeCvConfirm'),
          style: 'destructive',
          onPress: async () => {
            setRemovingCv(true);
            try {
              const updated = await authService.removeCv();
              onUserUpdated(updated);
              showToast(t('accountSettings.cvRemoved'));
            } catch (error) {
              const message =
                error instanceof Error && error.message
                  ? error.message
                  : t('accountSettings.cvRemoveFailed');
              showToast(message);
            } finally {
              setRemovingCv(false);
            }
          },
        },
      ]
    );
  };

  const handleSavePassword = async () => {
    if (newPassword.length < 8) {
      showToast(t('accountSettings.passwordTooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast(t('accountSettings.passwordMismatch'));
      return;
    }

    setSavingPassword(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setEditingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast(t('accountSettings.passwordUpdated'));
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : t('accountSettings.passwordUpdateFailed');
      showToast(message);
    } finally {
      setSavingPassword(false);
    }
  };

  const publicProfileHref =
    bexUser?.role === 'user' && bexUser.username
      ? (`/user/u/${bexUser.username}` as Href)
      : null;

  const handleOpenCompletedTasks = async () => {
    const stats = await usersRepository.getMyPublicProfileStats();
    setMyCompletedTasks(stats?.completedTasks ?? []);
    setShowTasksModal(true);
  };

  return (
    <>
      <ProfileAvatar
        name={bexUser?.displayName}
        avatarUrl={bexUser?.avatarUrl}
        size={88}
        editable
        loading={uploadingAvatar}
        onPress={handlePickAvatar}
      />
      <Text style={styles.avatarHint}>{t('accountSettings.avatarHint')}</Text>

      <Text style={styles.name}>{bexUser?.displayName ?? t('accountSettings.roleUser')}</Text>
      {bexUser?.role === 'user' && bexUser.username ? (
        <Text style={styles.username}>@{bexUser.username}</Text>
      ) : null}
      <Text style={styles.email}>{bexUser?.email ?? firebaseUser?.email ?? '—'}</Text>

      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {ROLE_LABELS[bexUser?.role ?? 'user']}
          </Text>
        </View>
        {bexUser?.phoneVerified ? (
          <View style={[styles.badge, styles.badgeSuccess]}>
            <Text style={[styles.badgeText, styles.badgeSuccessText]}>
              {t('accountSettings.phoneVerified')}
            </Text>
          </View>
        ) : null}
      </View>

      {bexUser?.role === 'user' ? (
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statBox} onPress={handleOpenCompletedTasks}>
            <Text style={styles.statValue}>{bexUser.completedTaskCount ?? 0}</Text>
            <Text style={styles.statLabel}>{t('accountSettings.completedTasks')}</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{bexUser.reputationScore ?? 0}</Text>
            <Text style={styles.statLabel}>{t('accountSettings.reputationScore')}</Text>
          </View>
        </View>
      ) : null}

      <CompletedTasksModal
        visible={showTasksModal}
        onClose={() => setShowTasksModal(false)}
        tasks={myCompletedTasks}
        totalCount={bexUser?.completedTaskCount}
      />

      <View style={styles.card}>
        {editingName ? (
          <View style={styles.editBlock}>
            <Input
              label={t('accountSettings.displayName')}
              value={nameDraft}
              onChangeText={setNameDraft}
              autoCapitalize="words"
            />
            <View style={styles.editActions}>
              <Button
                title={t('accountSettings.save')}
                size="sm"
                onPress={handleSaveName}
                loading={savingName}
                style={{ flex: 1 }}
              />
              <Button
                title={t('accountSettings.cancel')}
                variant="ghost"
                size="sm"
                onPress={() => {
                  setEditingName(false);
                  setNameDraft(bexUser?.displayName ?? '');
                }}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        ) : editingUsername && bexUser?.role === 'user' ? (
          <View style={styles.editBlock}>
            <Input
              label={t('accountSettings.username')}
              value={usernameDraft}
              onChangeText={(text) => setUsernameDraft(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={t('accountSettings.usernamePlaceholder')}
            />
            <Text style={styles.usernameHint}>
              {t('accountSettings.usernameHint')}
            </Text>
            <View style={styles.editActions}>
              <Button
                title={t('accountSettings.save')}
                size="sm"
                onPress={handleSaveUsername}
                loading={savingUsername}
                style={{ flex: 1 }}
              />
              <Button
                title={t('accountSettings.cancel')}
                variant="ghost"
                size="sm"
                onPress={() => {
                  setEditingUsername(false);
                  setUsernameDraft(bexUser?.username ?? '');
                }}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        ) : editingPassword ? (
          <View style={styles.editBlock}>
            <Input
              label={t('accountSettings.currentPassword')}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <Input
              label={t('accountSettings.newPassword')}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <Input
              label={t('accountSettings.confirmPassword')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <View style={styles.editActions}>
              <Button
                title={t('accountSettings.save')}
                size="sm"
                onPress={handleSavePassword}
                loading={savingPassword}
                style={{ flex: 1 }}
              />
              <Button
                title={t('accountSettings.cancel')}
                variant="ghost"
                size="sm"
                onPress={() => {
                  setEditingPassword(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        ) : (
          <>
            <Row label={t('accountSettings.phone')} value={bexUser?.phone || t('accountSettings.notAdded')} />
            {bexUser?.role === 'user' ? (
              <Row
                label={t('accountSettings.username')}
                value={bexUser.username ? `@${bexUser.username}` : t('accountSettings.notSet')}
              />
            ) : null}
            <Row label={t('accountSettings.completedTasks')} value={String(bexUser?.completedTaskCount ?? 0)} />
            <Row label={t('accountSettings.reputationScore')} value={String(bexUser?.reputationScore ?? 0)} />
            <Button
              title={t('accountSettings.editName')}
              variant="outline"
              size="sm"
              onPress={() => {
                setNameDraft(bexUser?.displayName ?? '');
                setEditingName(true);
              }}
            />
            {bexUser?.role === 'user' ? (
              <Button
                title={t('accountSettings.editUsername')}
                variant="outline"
                size="sm"
                onPress={() => {
                  setUsernameDraft(bexUser?.username ?? '');
                  setEditingUsername(true);
                }}
              />
            ) : null}
            {restMode ? (
              <Button
                title={t('accountSettings.changePassword')}
                variant="outline"
                size="sm"
                onPress={() => setEditingPassword(true)}
              />
            ) : null}
          </>
        )}
      </View>

      {bexUser?.role === 'user' ? (
        <View style={styles.card}>
          <Text style={styles.locationTitle}>{t('accountSettings.locationTitle')}</Text>
          <Text style={styles.locationHint}>
            {t('accountSettings.locationHint')}
          </Text>
          {editingLocation ? (
            <View style={styles.editBlock}>
              <LocationPicker
                city={locationCity}
                district={locationDistrict}
                onCityChange={setLocationCity}
                onDistrictChange={setLocationDistrict}
              />
              <View style={styles.editActions}>
                <Button
                  title={t('accountSettings.save')}
                  size="sm"
                  onPress={handleSaveLocation}
                  loading={savingLocation}
                  style={{ flex: 1 }}
                />
                <Button
                  title={t('accountSettings.cancel')}
                  variant="ghost"
                  size="sm"
                  onPress={() => {
                    setEditingLocation(false);
                    setLocationCity(bexUser?.city ?? 'İstanbul');
                    setLocationDistrict(bexUser?.district ?? '');
                  }}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          ) : (
            <>
              <Row
                label={t('accountSettings.cityDistrict')}
                value={
                  bexUser.city && bexUser.district
                    ? `${bexUser.city}, ${bexUser.district}`
                    : t('accountSettings.notSet')
                }
              />
              <Button
                title={t('accountSettings.editLocation')}
                variant="outline"
                size="sm"
                onPress={() => {
                  setLocationCity(bexUser.city ?? 'İstanbul');
                  setLocationDistrict(bexUser.district ?? '');
                  setEditingLocation(true);
                }}
              />
            </>
          )}
        </View>
      ) : null}

      {bexUser?.role === 'user' ? (
        <View style={styles.card}>
          <Text style={styles.locationTitle}>{t('accountSettings.bioTitle')}</Text>
          <Text style={styles.locationHint}>{t('accountSettings.bioHint')}</Text>
          {editingBio ? (
            <View style={styles.editBlock}>
              <Input
                label={t('accountSettings.bioLabel')}
                value={bioDraft}
                onChangeText={setBioDraft}
                placeholder={t('accountSettings.bioPlaceholder')}
                multiline
                numberOfLines={5}
                maxLength={1000}
                style={{ minHeight: 120, textAlignVertical: 'top' }}
              />
              <View style={styles.editActions}>
                <Button
                  title={t('accountSettings.save')}
                  size="sm"
                  onPress={handleSaveBio}
                  loading={savingBio}
                  style={{ flex: 1 }}
                />
                <Button
                  title={t('accountSettings.cancel')}
                  variant="ghost"
                  size="sm"
                  onPress={() => {
                    setEditingBio(false);
                    setBioDraft(bexUser?.bio ?? '');
                  }}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.bioPreview}>
                {bexUser.bio?.trim() ? bexUser.bio : t('accountSettings.bioEmpty')}
              </Text>
              <Button
                title={t('accountSettings.editBio')}
                variant="outline"
                size="sm"
                onPress={() => {
                  setBioDraft(bexUser.bio ?? '');
                  setEditingBio(true);
                }}
              />
            </>
          )}
        </View>
      ) : null}

      {bexUser?.role === 'user' ? (
        <View style={styles.card}>
          <Text style={styles.locationTitle}>{t('accountSettings.cvTitle')}</Text>
          <Text style={styles.locationHint}>{t('accountSettings.cvHint')}</Text>
          {bexUser.cvUrl ? (
            <>
              <TouchableOpacity
                onPress={() => {
                  void openProtectedMediaUrl(bexUser.cvUrl!).catch((err) => {
                    showToast(err instanceof Error ? err.message : t('accountSettings.cvOpenFailed'));
                  });
                }}
              >
                <Text style={styles.cvLink}>{t('accountSettings.viewCv')}</Text>
              </TouchableOpacity>
              <View style={styles.editActions}>
                <Button
                  title={t('accountSettings.replaceCv')}
                  variant="outline"
                  size="sm"
                  onPress={handlePickCv}
                  loading={uploadingCv}
                  style={{ flex: 1 }}
                />
                <Button
                  title={t('accountSettings.removeCv')}
                  variant="ghost"
                  size="sm"
                  onPress={handleRemoveCv}
                  loading={removingCv}
                  style={{ flex: 1 }}
                  textStyle={{ color: Colors.error }}
                />
              </View>
            </>
          ) : (
            <Button
              title={t('accountSettings.uploadCv')}
              variant="outline"
              size="sm"
              onPress={handlePickCv}
              loading={uploadingCv}
            />
          )}
        </View>
      ) : null}

      {publicProfileHref ? (
        <Button
          title={t('accountSettings.publicProfile')}
          variant="outline"
          onPress={() => router.push(publicProfileHref)}
        />
      ) : bexUser?.role === 'user' && firebaseUser ? (
        <Button
          title={t('accountSettings.publicProfile')}
          variant="outline"
          onPress={async () => {
            const profileId = (await getRestProfileId()) ?? firebaseUser.uid;
            router.push(`/user/${profileId}` as Href);
          }}
        />
      ) : null}

      {showAdminLink && bexUser?.role === 'admin' && (
        <Button
          title={t('accountSettings.adminPanel')}
          onPress={() => router.push('/(admin)/panel' as Href)}
        />
      )}

      {!bexUser?.phoneVerified && !restMode && (
        <Button
          title={t('accountSettings.verifyPhone')}
          variant="secondary"
          onPress={() => router.push('/(auth)/phone-verification' as Href)}
        />
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const styles = useAccountSettingsStyles();
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const useAccountSettingsStyles = createThemedStyles((Colors) => ({
  avatarHint: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: -Spacing[2],
  },
  name: { ...Typography.headingMedium, color: Colors.textPrimary },
  username: { ...Typography.labelMedium, color: Colors.primary },
  usernameHint: { ...Typography.caption, color: Colors.textMuted, lineHeight: 18 },
  email: { ...Typography.bodyMedium, color: Colors.textSecondary },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeSuccess: {
    backgroundColor: Colors.success + '18',
    borderColor: Colors.success,
  },
  badgeText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  badgeSuccessText: { color: Colors.success },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    width: '100%',
  },
  statBox: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { ...Typography.headingMedium, color: Colors.primaryDark },
  statLabel: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing[3],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing[3],
  },
  rowLabel: { ...Typography.bodySmall, color: Colors.textMuted },
  rowValue: { ...Typography.labelMedium, color: Colors.textPrimary },
  editBlock: { gap: Spacing[3] },
  editActions: { flexDirection: 'row', gap: Spacing[2] },
  locationTitle: { ...Typography.labelLarge, color: Colors.textPrimary },
  locationHint: { ...Typography.caption, color: Colors.textMuted, lineHeight: 18 },
  bioPreview: { ...Typography.bodyMedium, color: Colors.textSecondary, lineHeight: 22 },
  cvLink: { ...Typography.labelMedium, color: Colors.primary },
}));
