import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Screen } from '@/components/common/Screen';
import { router, useLocalSearchParams, Href } from 'expo-router';
import { useFocusEffect } from "expo-router/react-navigation";
import * as ImagePicker from 'expo-image-picker';
import { isCurrentApplicationOwner } from '@/features/application/applicationsApi';
import { applicationsRepository, tasksRepository } from '@/features/data';
import {
  findOversizedSubmissionFiles,
  parseLinkInput,
  uploadSubmissionAttachments,
  uploadSubmissionPhotos,
} from '@/features/applications/submissionService';
import { useAuthStore } from '@/store/authStore';
import { Button, Input } from '@/components/ui';
import { useToast } from '@/components/common/Toast';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

type LocalFile = { uri: string; name: string; mimeType: string; size?: number };

export default function SubmitTaskScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { firebaseUser } = useAuthStore();
  const { showToast } = useToast();
  const [taskTitle, setTaskTitle] = useState('');
  const [canSubmit, setCanSubmit] = useState(false);
  const [checking, setChecking] = useState(true);
  const [submissionText, setSubmissionText] = useState('');
  const [photos, setPhotos] = useState<LocalFile[]>([]);
  const [documents, setDocuments] = useState<LocalFile[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadApplication = useCallback(async () => {
    if (!id || !firebaseUser) return;

    setChecking(true);
    setError('');

    const app = await applicationsRepository.getById(id);
    if (!app) {
      setError(t('submitTaskScreen.notFound'));
      setCanSubmit(false);
      setChecking(false);
      return;
    }

    if (!(await isCurrentApplicationOwner(app.userId, firebaseUser.uid))) {
      setError(t('submitTaskScreen.notOwner'));
      setCanSubmit(false);
      setChecking(false);
      return;
    }

    if (app.status !== 'approved') {
      setError(
        app.status === 'submitted'
          ? t('submitTaskScreen.alreadySubmitted')
          : t('submitTaskScreen.notApproved')
      );
      setCanSubmit(false);
      setChecking(false);
      return;
    }

    const task = await tasksRepository.getById(app.taskId);
    setTaskTitle(task?.title ?? t('submitTaskScreen.defaultTask'));
    setCanSubmit(true);
    setChecking(false);
  }, [id, firebaseUser, t]);

  useFocusEffect(
    useCallback(() => {
      loadApplication();
    }, [loadApplication])
  );

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5 - photos.length,
    });

    if (result.canceled || !result.assets?.length) return;

    const picked = result.assets.map((asset, index) => {
      const rawMime = asset.mimeType?.toLowerCase() ?? 'image/jpeg';
      const isHeic = rawMime.includes('heic') || rawMime.includes('heif');
      const fileName = asset.fileName ?? `photo-${index + 1}.jpg`;
      return {
        uri: asset.uri,
        name: isHeic ? fileName.replace(/\.(heic|heif)$/i, '.jpg') : fileName,
        mimeType: isHeic ? 'image/jpeg' : rawMime,
        size: asset.fileSize,
      };
    });

    setPhotos((prev) => [...prev, ...picked].slice(0, 5));
  };

  const pickDocuments = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
      type: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip',
        'text/plain',
        'image/*',
      ],
    });

    if (result.canceled || !result.assets?.length) return;

    const picked = result.assets.map((asset, index) => ({
      uri: asset.uri,
      name: asset.name ?? `document-${index + 1}`,
      mimeType: asset.mimeType ?? 'application/octet-stream',
      size: asset.size,
    }));

    setDocuments((prev) => [...prev, ...picked].slice(0, 5));
  };

  const removePhoto = (uri: string) => {
    setPhotos((prev) => prev.filter((f) => f.uri !== uri));
  };

  const removeDocument = (uri: string) => {
    setDocuments((prev) => prev.filter((f) => f.uri !== uri));
  };

  const addLink = () => {
    const next = parseLinkInput(linkInput);
    if (next.length === 0) {
      setError(t('submitTaskScreen.errorInvalidLink'));
      return;
    }
    setLinks((prev) => [...prev, ...next].slice(0, 5));
    setLinkInput('');
    setError('');
  };

  const removeLink = (link: string) => {
    setLinks((prev) => prev.filter((item) => item !== link));
  };

  const hasProof = photos.length > 0 || documents.length > 0 || links.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    if (!submissionText.trim() || submissionText.trim().length < 10) {
      setError(t('submitTaskScreen.errorDescMin'));
      return;
    }
    if (!hasProof) {
      setError(t('submitTaskScreen.errorNoProof'));
      return;
    }
    const oversized = findOversizedSubmissionFiles([...photos, ...documents]);
    if (oversized) {
      setError(t('submitTaskScreen.errorFileTooLarge', { name: oversized.name }));
      return;
    }
    if (!id || !firebaseUser) return;

    setLoading(true);
    setError('');

    try {
      let photoUrls: string[] = [];
      let attachmentUrls: string[] = [];

      if (photos.length > 0) {
        try {
          photoUrls = await uploadSubmissionPhotos(id, firebaseUser.uid, photos);
        } catch (uploadErr: unknown) {
          const detail =
            uploadErr instanceof Error ? uploadErr.message : t('submitTaskScreen.errorGeneric');
          throw new Error(`${t('submitTaskScreen.errorPhotoUpload')}: ${detail}`);
        }
      }

      if (documents.length > 0) {
        try {
          attachmentUrls = await uploadSubmissionAttachments(id, firebaseUser.uid, documents);
        } catch (uploadErr: unknown) {
          const detail =
            uploadErr instanceof Error ? uploadErr.message : t('submitTaskScreen.errorGeneric');
          throw new Error(`${t('submitTaskScreen.errorFileUpload')}: ${detail}`);
        }
      }

      await applicationsRepository.submit(
        id,
        submissionText.trim(),
        photoUrls,
        attachmentUrls,
        links
      );
      showToast(t('submitTaskScreen.successToast'));
      router.replace('/(tabs)/applications' as Href);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message.replace(/^\[\d+\]\s*/, '')
          : t('submitTaskScreen.errorGeneric');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Screen style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>{t('submitTaskScreen.back')}</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{t('submitTaskScreen.title')}</Text>
          {taskTitle ? <Text style={styles.taskTitle}>{taskTitle}</Text> : null}
          <Text style={styles.subtitle}>{t('submitTaskScreen.subtitle')}</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              {!canSubmit ? (
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: Spacing[2] }}>
                  <Text style={styles.backLink}>{t('submitTaskScreen.backToApplication')}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {canSubmit ? (
            <>
              <Input
                label={t('submitTaskScreen.descriptionLabel')}
                placeholder={t('submitTaskScreen.descriptionPlaceholder')}
                value={submissionText}
                onChangeText={setSubmissionText}
                multiline
                numberOfLines={6}
              />

              <View style={styles.uploadSection}>
                <Text style={styles.uploadLabel}>{t('submitTaskScreen.photosLabel')}</Text>
                <Button
                  title={t('submitTaskScreen.pickFromGallery')}
                  variant="outline"
                  size="md"
                  onPress={pickImages}
                  disabled={photos.length >= 5}
                />
                {photos.length > 0 ? (
                  <View style={styles.previewRow}>
                    {photos.map((file) => (
                      <TouchableOpacity
                        key={file.uri}
                        style={styles.thumbWrap}
                        onPress={() => removePhoto(file.uri)}
                      >
                        <Image source={{ uri: file.uri }} style={styles.thumb} />
                        <Text style={styles.removeHint}>{t('submitTaskScreen.remove')}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.uploadHint}>{t('submitTaskScreen.noPhotos')}</Text>
                )}
              </View>

              <View style={styles.uploadSection}>
                <Text style={styles.uploadLabel}>{t('submitTaskScreen.documentsLabel')}</Text>
                <Button
                  title={t('submitTaskScreen.pickDocuments')}
                  variant="outline"
                  size="md"
                  onPress={pickDocuments}
                  disabled={documents.length >= 5}
                />
                {documents.length > 0 ? (
                  <View style={styles.fileList}>
                    {documents.map((file) => (
                      <TouchableOpacity
                        key={file.uri}
                        style={styles.fileRow}
                        onPress={() => removeDocument(file.uri)}
                      >
                        <Text style={styles.fileName} numberOfLines={1}>
                          {file.name}
                        </Text>
                        <Text style={styles.removeHint}>{t('submitTaskScreen.remove')}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.uploadHint}>{t('submitTaskScreen.noDocuments')}</Text>
                )}
              </View>

              <View style={styles.uploadSection}>
                <Text style={styles.uploadLabel}>{t('submitTaskScreen.linksLabel')}</Text>
                <Input
                  placeholder={t('submitTaskScreen.linkPlaceholder')}
                  value={linkInput}
                  onChangeText={setLinkInput}
                  autoCapitalize="none"
                  keyboardType="url"
                />
                <Button
                  title={t('submitTaskScreen.addLink')}
                  variant="outline"
                  size="md"
                  onPress={addLink}
                  disabled={links.length >= 5}
                />
                {links.length > 0 ? (
                  <View style={styles.fileList}>
                    {links.map((link) => (
                      <TouchableOpacity
                        key={link}
                        style={styles.fileRow}
                        onPress={() => removeLink(link)}
                      >
                        <Text style={styles.linkText} numberOfLines={2}>
                          {link}
                        </Text>
                        <Text style={styles.removeHint}>{t('submitTaskScreen.remove')}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.uploadHint}>{t('submitTaskScreen.noLinks')}</Text>
                )}
              </View>

              <Button title={t('submitTaskScreen.submit')} onPress={handleSubmit} loading={loading} />
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: Spacing[5], gap: Spacing[5], paddingBottom: Spacing[10] },
  back: { alignSelf: 'flex-start' },
  backText: { ...Typography.labelMedium, color: Colors.textSecondary },
  backLink: { ...Typography.labelMedium, color: Colors.primary },
  title: { ...Typography.headingLarge, color: Colors.textPrimary },
  taskTitle: { ...Typography.bodyLarge, color: Colors.primary, fontWeight: '600' },
  subtitle: { ...Typography.bodyMedium, color: Colors.textSecondary, lineHeight: 22 },
  errorBox: {
    backgroundColor: Colors.errorLight,
    padding: Spacing[3],
    borderRadius: Radius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  errorText: { ...Typography.bodySmall, color: Colors.error },
  uploadSection: { gap: Spacing[3] },
  uploadLabel: { ...Typography.labelMedium, color: Colors.textPrimary },
  uploadHint: { ...Typography.bodySmall, color: Colors.textMuted },
  previewRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
  thumbWrap: { alignItems: 'center', gap: 4 },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
  },
  fileList: { gap: Spacing[2] },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing[2],
    padding: Spacing[3],
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
  },
  fileName: { ...Typography.bodySmall, color: Colors.textPrimary, flex: 1 },
  linkText: { ...Typography.bodySmall, color: Colors.primary, flex: 1 },
  removeHint: { ...Typography.caption, color: Colors.error },
}));
