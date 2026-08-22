import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApplicationMessage, UserRole } from '@/types';
import { messagesRepository } from '@/features/messages';
import {
  markConversationRead,
  markConversationReadByApplication,
  resolveConversationId,
} from '@/features/messages/conversationsApi';
import {
  acceptConversationOffer,
  rejectConversationOffer,
  sendConversationOffer,
  SendChatOfferInput,
} from '@/features/messages/offersApi';
import { ChatOfferBubble } from '@/components/messaging/ChatOfferBubble';
import { ChatImageAttachButton, ChatImageBubble } from '@/components/messaging/ChatImageBubble';
import { ReportChatImageSheet } from '@/components/messaging/ReportChatImageSheet';
import { SendOfferSheet } from '@/components/messaging/SendOfferSheet';
import { markConversationNotificationsRead } from '@/features/notifications/notificationsApi';
import { notifyMessagingInboxRead } from '@/store/messagingInboxStore';
import { triggerNotificationRefresh } from '@/store/notificationRefreshBridge';
import { uploadLocalFiles } from '@/lib/storageUpload';
import { normalizeUploadPath } from '@/lib/mediaUrl';
import { useToast } from '@/components/common/Toast';
import { formatRelativeTime } from '@/lib/dateUtils';
import { readableTextInputStyle, textInputPaddingVertical } from '@/lib/textInputStyle';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

interface ChatThreadViewProps {
  applicationId: string;
  currentUserId: string;
  currentUserRole: UserRole;
  variant?: 'embedded' | 'fullscreen';
  peerLabel?: string;
  taskTitle?: string;
  /** Bu sohbetteki okunmamış sayısı — rozet anında düşsün */
  priorUnread?: number;
  messagingAudience?: 'user' | 'business';
}

type PendingChatImage = {
  uri: string;
  name: string;
  mimeType: string;
};

export function ChatThreadView({
  applicationId,
  currentUserId,
  currentUserRole,
  variant = 'fullscreen',
  peerLabel,
  taskTitle,
  priorUnread = 0,
  messagingAudience = 'user',
}: ChatThreadViewProps) {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<ApplicationMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [imageSending, setImageSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [offerSheetOpen, setOfferSheetOpen] = useState(false);
  const [offerSending, setOfferSending] = useState(false);
  const [offerActingId, setOfferActingId] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<ApplicationMessage | null>(null);
  const [reportSheetOpen, setReportSheetOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<PendingChatImage | null>(null);
  const listRef = useRef<FlatList<ApplicationMessage>>(null);
  const prevCount = useRef(0);
  const isNearBottomRef = useRef(true);
  const didInitialScrollRef = useRef(false);
  const clearedUnreadRef = useRef(false);
  const isFullscreen = variant === 'fullscreen';

  const scrollToEnd = useCallback((animated = true) => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated });
    }
  }, [messages.length]);

  const handleListScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    isNearBottomRef.current =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - 96;
  }, []);

  const markRead = useCallback(async () => {
    if (!clearedUnreadRef.current && priorUnread > 0) {
      clearedUnreadRef.current = true;
      notifyMessagingInboxRead(priorUnread, messagingAudience);
    }

    try {
      const result = await markConversationReadByApplication(applicationId, priorUnread);
      const conversationId =
        result.conversationId ?? (await resolveConversationId(applicationId));
      if (conversationId) {
        await markConversationRead(conversationId).catch(() => {});
        await markConversationNotificationsRead(conversationId);
        triggerNotificationRefresh();
      }
    } catch {
      // Mesaj GET isteği backend'de okundu işaretler
    } finally {
      notifyMessagingInboxRead(0, messagingAudience);
    }
  }, [applicationId, priorUnread, messagingAudience]);

  useEffect(() => {
    const unsubscribe = messagesRepository.subscribe(applicationId, (list) => {
      setMessages((prev) => {
        const merged = new Map<string, ApplicationMessage>();
        for (const msg of prev) merged.set(msg.id, msg);
        for (const msg of list) merged.set(msg.id, msg);
        return Array.from(merged.values()).sort(
          (a, b) => a.createdAt.toMillis() - b.createdAt.toMillis()
        );
      });
      setLoading(false);
    });
    return unsubscribe;
  }, [applicationId]);

  useEffect(() => {
    void resolveConversationId(applicationId).then(setConversationId);
  }, [applicationId]);

  useFocusEffect(
    useCallback(() => {
      clearedUnreadRef.current = false;
      void messagesRepository.getByApplication(applicationId).then((list) => {
        setMessages(list);
        setLoading(false);
        void markRead();
      });
    }, [applicationId, markRead])
  );

  useEffect(() => {
    if (messages.length === 0) {
      didInitialScrollRef.current = false;
      prevCount.current = 0;
      return;
    }

    if (!didInitialScrollRef.current) {
      didInitialScrollRef.current = true;
      requestAnimationFrame(() => scrollToEnd(false));
      prevCount.current = messages.length;
      return;
    }

    if (messages.length > prevCount.current && isNearBottomRef.current) {
      requestAnimationFrame(() => scrollToEnd(true));
    }
    prevCount.current = messages.length;
  }, [messages.length, scrollToEnd]);

  const refreshMessages = useCallback(async () => {
    const list = await messagesRepository.getByApplication(applicationId);
    setMessages(list);
    return list;
  }, [applicationId]);

  const handleSendOffer = async (input: SendChatOfferInput) => {
    if (!conversationId || offerSending) return;
    setOfferSending(true);
    setSendError(null);
    try {
      await sendConversationOffer(conversationId, input);
      setOfferSheetOpen(false);
      await refreshMessages();
      scrollToEnd();
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : t('chatThreadView.offerSendFailed'));
    } finally {
      setOfferSending(false);
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    if (!conversationId || offerActingId) return;
    setOfferActingId(offerId);
    setSendError(null);
    try {
      await acceptConversationOffer(conversationId, offerId);
      await refreshMessages();
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : t('chatThreadView.offerAcceptFailed'));
    } finally {
      setOfferActingId(null);
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    if (!conversationId || offerActingId) return;
    setOfferActingId(offerId);
    setSendError(null);
    try {
      await rejectConversationOffer(conversationId, offerId);
      await refreshMessages();
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : t('chatThreadView.offerRejectFailed'));
    } finally {
      setOfferActingId(null);
    }
  };

  const isBusiness = currentUserRole === 'business';

  const handleSend = async () => {
    if (!text.trim() || sending || imageSending) return;
    setSending(true);
    setSendError(null);
    try {
      await messagesRepository.send(
        applicationId,
        currentUserId,
        currentUserRole,
        text
      );
      setText('');
      isNearBottomRef.current = true;
      await refreshMessages();
      scrollToEnd(true);
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : t('chatThreadView.messageSendFailed'));
    } finally {
      setSending(false);
    }
  };

  const handlePickImage = async () => {
    if (imageSending || sending) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('chatThreadView.permissionRequiredTitle'), t('chatThreadView.permissionRequiredText'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.82,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    setSendError(null);
    setPendingImage({
      uri: asset.uri,
      name: asset.fileName ?? 'chat-photo.jpg',
      mimeType: asset.mimeType ?? 'image/jpeg',
    });
  };

  const handleCancelPendingImage = () => {
    if (imageSending) return;
    setPendingImage(null);
    setSendError(null);
  };

  const handleConfirmSendImage = async () => {
    if (!pendingImage || imageSending || sending) return;

    setImageSending(true);
    setSendError(null);
    try {
      const uploaded = await uploadLocalFiles(`chat/${applicationId}`, [
        {
          uri: pendingImage.uri,
          name: pendingImage.name,
          mimeType: pendingImage.mimeType,
        },
      ]);
      const mediaUrl = normalizeUploadPath(uploaded[0] ?? '');
      if (!mediaUrl) throw new Error(t('chatThreadView.imageUploadFailed'));

      const caption = text.trim() || undefined;
      await messagesRepository.sendImage(
        applicationId,
        currentUserId,
        currentUserRole,
        mediaUrl,
        caption
      );
      setPendingImage(null);
      setText('');
      isNearBottomRef.current = true;
      showToast(t('chatThreadView.imageSentToast'));
      await refreshMessages();
      scrollToEnd(true);
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : t('chatThreadView.imageSendFailed'));
    } finally {
      setImageSending(false);
    }
  };

  const openReportSheet = (item: ApplicationMessage) => {
    setReportTarget(item);
    setReportSheetOpen(true);
  };

  const inputBar = (
    <View
      style={[
        styles.inputBar,
        isFullscreen && { paddingBottom: Math.max(insets.bottom, Spacing[3]) },
      ]}
    >
      {sendError ? <Text style={styles.error}>{sendError}</Text> : null}
      {pendingImage ? (
        <View style={styles.previewBox}>
          <Image source={{ uri: pendingImage.uri }} style={styles.previewImage} resizeMode="cover" />
          <View style={styles.previewMeta}>
            <Text style={styles.previewLabel}>{t('chatThreadView.imagePreviewLabel')}</Text>
            <Text style={styles.previewHint}>
              {t('chatThreadView.imagePreviewHint')}
            </Text>
            <View style={styles.previewActions}>
              <TouchableOpacity
                style={styles.previewCancelBtn}
                onPress={handleCancelPendingImage}
                disabled={imageSending}
              >
                <Text style={styles.previewCancelText}>{t('chatThreadView.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.previewSendBtn, imageSending && styles.previewSendBtnDisabled]}
                onPress={handleConfirmSendImage}
                disabled={imageSending}
              >
                {imageSending ? (
                  <ActivityIndicator color={Colors.textOnPrimary} size="small" />
                ) : (
                  <Text style={styles.previewSendText}>{t('chatThreadView.send')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}
      {isBusiness ? (
        <TouchableOpacity
          style={[styles.offerBtn, !conversationId && styles.offerBtnDisabled]}
          onPress={() => setOfferSheetOpen(true)}
          disabled={!conversationId || offerSending}
          activeOpacity={0.88}
        >
          <Text style={styles.offerBtnText}>{t('chatThreadView.sendOffer')}</Text>
        </TouchableOpacity>
      ) : null}
      <View style={styles.inputRow}>
        <ChatImageAttachButton
          onPress={handlePickImage}
          disabled={!conversationId || imageSending}
          loading={false}
        />
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={pendingImage ? t('chatThreadView.imageNotePlaceholder') : t('chatThreadView.messagePlaceholder')}
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            ((!text.trim() && !pendingImage) || sending || imageSending) && styles.sendBtnDisabled,
          ]}
          onPress={pendingImage ? handleConfirmSendImage : handleSend}
          disabled={(!text.trim() && !pendingImage) || sending || imageSending}
        >
          {sending || imageSending ? (
            <ActivityIndicator color={Colors.textOnPrimary} size="small" />
          ) : (
            <Text style={styles.sendText}>↑</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loading, isFullscreen && styles.loadingFullscreen]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, isFullscreen && styles.rootFullscreen]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={isFullscreen ? 0 : 0}
    >
      {!isFullscreen && peerLabel ? (
        <View style={styles.embeddedHeader}>
          <Text style={styles.embeddedTitle}>{t('chatThreadView.messagesTitle')}</Text>
          <Text style={styles.embeddedSubtitle}>
            {peerLabel}
            {taskTitle ? ` · ${taskTitle}` : ''}
          </Text>
        </View>
      ) : null}

      <View style={[styles.messagesPane, isFullscreen && styles.messagesPaneFullscreen]}>
        {messages.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>{t('chatThreadView.startChatTitle')}</Text>
            <Text style={styles.emptyText}>
              {t('chatThreadView.startChatText', { peer: peerLabel ?? t('chatThreadView.defaultBusiness') })}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            style={isFullscreen ? styles.listFullscreen : styles.listEmbedded}
            contentContainerStyle={[
              styles.listContent,
              isFullscreen && styles.listFullscreenContent,
            ]}
            showsVerticalScrollIndicator
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onScroll={handleListScroll}
            scrollEventThrottle={16}
            renderItem={({ item }) => {
            const mine = item.senderId === currentUserId;
            if (item.messageType === 'offer' && item.offer) {
              return (
                <ChatOfferBubble
                  offer={item.offer}
                  mine={mine}
                  createdAt={item.createdAt}
                  onAccept={
                    !mine && item.offer.status === 'PENDING'
                      ? () => handleAcceptOffer(item.offer!.id)
                      : undefined
                  }
                  onReject={
                    !mine && item.offer.status === 'PENDING'
                      ? () => handleRejectOffer(item.offer!.id)
                      : undefined
                  }
                  acting={offerActingId === item.offer.id}
                />
              );
            }
            if (item.messageType === 'system') {
              return (
                <View style={styles.systemRow}>
                  <Text style={styles.systemText}>{item.text}</Text>
                </View>
              );
            }
            if (item.messageType === 'image' && item.mediaUrl) {
              return (
                <ChatImageBubble
                  mediaUrl={item.mediaUrl}
                  caption={item.text}
                  mine={mine}
                  createdAt={item.createdAt}
                  isRead={item.isRead}
                  onReport={!mine ? () => openReportSheet(item) : undefined}
                />
              );
            }
            return (
              <View style={[styles.row, mine ? styles.rowMine : styles.rowOther]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                  <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>
                    {item.text}
                  </Text>
                  <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>
                    {formatRelativeTime(item.createdAt) || t('chatThreadView.justNow')}
                    {mine && item.isRead ? t('chatThreadView.readSuffix') : ''}
                  </Text>
                </View>
              </View>
            );
          }}
          />
        )}
      </View>

      {inputBar}

      <SendOfferSheet
        visible={offerSheetOpen}
        onClose={() => setOfferSheetOpen(false)}
        onSubmit={handleSendOffer}
        loading={offerSending}
      />

      <ReportChatImageSheet
        visible={reportSheetOpen}
        conversationId={conversationId}
        messageId={reportTarget?.id ?? null}
        onClose={() => {
          setReportSheetOpen(false);
          setReportTarget(null);
        }}
        onSubmitted={() => showToast(t('chatThreadView.reportReceivedToast'))}
      />
    </KeyboardAvoidingView>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  root: {
    gap: Spacing[3],
  },
  rootFullscreen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loading: {
    paddingVertical: Spacing[8],
    alignItems: 'center',
  },
  loadingFullscreen: {
    flex: 1,
    justifyContent: 'center',
  },
  embeddedHeader: {
    gap: 2,
  },
  embeddedTitle: { ...Typography.labelLarge, color: Colors.textPrimary },
  embeddedSubtitle: { ...Typography.caption, color: Colors.textMuted, lineHeight: 18 },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[8],
    gap: Spacing[2],
    minHeight: 160,
  },
  messagesPane: {
    minHeight: 0,
  },
  messagesPaneFullscreen: {
    flex: 1,
  },
  listEmbedded: {
    flexGrow: 0,
    maxHeight: 320,
  },
  listFullscreen: {
    flex: 1,
  },
  listContent: {
    paddingVertical: Spacing[2],
    gap: Spacing[2],
  },
  listFullscreenContent: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[2],
    flexGrow: 1,
  },
  emptyIcon: { fontSize: 40, marginBottom: Spacing[2] },
  emptyTitle: { ...Typography.labelLarge, color: Colors.textPrimary },
  emptyText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  row: {
    width: '100%',
    marginBottom: Spacing[2],
  },
  rowMine: { alignItems: 'flex-end' },
  rowOther: { alignItems: 'flex-start' },
  systemRow: {
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing[3],
    paddingHorizontal: Spacing[6],
  },
  systemText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    overflow: 'hidden',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderRadius: Radius.xl,
    gap: 4,
  },
  bubbleMine: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: Radius.xs,
  },
  bubbleOther: {
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: Radius.xs,
  },
  bubbleText: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  bubbleTextMine: { color: Colors.textOnPrimary },
  bubbleTime: { ...Typography.caption, color: Colors.textMuted, alignSelf: 'flex-end' },
  bubbleTimeMine: { color: Colors.textOnGold, opacity: 0.72 },
  inputBar: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    gap: Spacing[2],
  },
  error: { ...Typography.caption, color: Colors.error },
  previewBox: {
    flexDirection: 'row',
    gap: Spacing[3],
    padding: Spacing[3],
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewImage: {
    width: 96,
    height: 96,
    borderRadius: Radius.md,
    backgroundColor: Colors.borderLight,
  },
  previewMeta: { flex: 1, gap: Spacing[1], justifyContent: 'center' },
  previewLabel: { ...Typography.labelMedium, color: Colors.textPrimary },
  previewHint: { ...Typography.caption, color: Colors.textMuted, lineHeight: 18 },
  previewActions: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginTop: Spacing[2],
  },
  previewCancelBtn: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewCancelText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '700' },
  previewSendBtn: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    minWidth: 88,
    alignItems: 'center',
  },
  previewSendBtnDisabled: { opacity: 0.55 },
  previewSendText: { ...Typography.caption, color: Colors.textOnPrimary, fontWeight: '800' },
  offerBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  offerBtnDisabled: { opacity: 0.45 },
  offerBtnText: { ...Typography.caption, color: Colors.primary, fontWeight: '700' },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing[4],
    paddingVertical: textInputPaddingVertical,
    fontFamily: Typography.bodyMedium.fontFamily,
    fontSize: Typography.bodyMedium.fontSize,
    color: Colors.textPrimary,
    ...readableTextInputStyle,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.45 },
  sendText: {
    ...Typography.labelLarge,
    color: Colors.textOnPrimary,
    fontWeight: '800',
    fontSize: 20,
    lineHeight: 22,
  },
}));
