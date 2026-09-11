import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Screen } from '@/components/common/Screen';
import { useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from "expo-router/react-navigation";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  fetchSwapOfferChatContext,
  fetchSwapOfferMessages,
  mapSwapOfferStatus,
  normalizeSwapOfferId,
  sendSwapOfferMessage,
  SwapOfferMessage,
} from '@/features/trade/swapOfferChatApi';
import { leaveSwapOfferChat } from '@/features/trade/swapChatNavigation';
import { useToast } from '@/components/common/Toast';
import { Typography, Spacing, Radius, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';
import { readableTextInputStyle, textInputPaddingVertical } from '@/lib/textInputStyle';
import type { TradeOfferStatus } from '@/features/trade/types';

const POLL_MS = 4000;

type ChatRow =
  | { kind: 'message'; id: string; body: string; mine: boolean }
  | { kind: 'intro'; id: string; body: string };

function buildRows(messages: SwapOfferMessage[], initialMessage?: string | null): ChatRow[] {
  const rows: ChatRow[] = [];
  const trimmedIntro = initialMessage?.trim();
  if (trimmedIntro) {
    const alreadyShown = messages.some((m) => m.body.trim() === trimmedIntro);
    if (!alreadyShown) {
      rows.push({ kind: 'intro', id: 'intro-offer', body: trimmedIntro });
    }
  }
  for (const message of messages) {
    rows.push({
      kind: 'message',
      id: message.id,
      body: message.body,
      mine: message.mine,
    });
  }
  return rows;
}

export default function SwapChatScreen() {
  const params = useLocalSearchParams<{ offerId: string | string[] }>();
  const offerId = normalizeSwapOfferId(params.offerId);
  const { t } = useTranslation();
  const { showToast } = useToast();
  const Colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const styles = useMemoStyles(Colors);
  const [messages, setMessages] = useState<SwapOfferMessage[]>([]);
  const [listingTitle, setListingTitle] = useState('');
  const [peerName, setPeerName] = useState('');
  const [offerStatus, setOfferStatus] = useState<TradeOfferStatus>('pending');
  const [initialMessage, setInitialMessage] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);
  const chatOpen = offerStatus === 'pending';

  const rows = useMemo(
    () => buildRows(messages, initialMessage),
    [messages, initialMessage]
  );

  const load = useCallback(
    async (silent = false) => {
      if (!offerId) return;
      if (!silent) setLoading(true);
      try {
        const [context, list] = await Promise.all([
          fetchSwapOfferChatContext(offerId),
          fetchSwapOfferMessages(offerId),
        ]);
        setListingTitle(context.listingTitle);
        setPeerName(context.peerName);
        setOfferStatus(mapSwapOfferStatus(context.status));
        setInitialMessage(context.initialMessage ?? null);
        setMessages(list);
      } catch (err) {
        if (!silent) {
          showToast(err instanceof Error ? err.message : t('swapChat.loadError'));
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [offerId, showToast, t]
  );

  useFocusEffect(
    useCallback(() => {
      void load();
      const timer = setInterval(() => void load(true), POLL_MS);
      return () => clearInterval(timer);
    }, [load])
  );

  useEffect(() => {
    if (rows.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
    }
  }, [rows.length]);

  const handleSend = async () => {
    const body = text.trim();
    if (!body || !offerId || sending || !chatOpen) return;
    setSending(true);
    try {
      const saved = await sendSwapOfferMessage(offerId, body);
      setText('');
      setMessages((prev) => {
        if (prev.some((item) => item.id === saved.id)) return prev;
        return [...prev, saved];
      });
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('swapChat.sendFailed'));
    } finally {
      setSending(false);
    }
  };

  if (!offerId) {
    return (
      <Screen style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={leaveSwapOfferChat} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('swapChat.title')}</Text>
          <Text style={styles.subtitle}>{t('swapChat.notFound')}</Text>
        </View>
      </Screen>
    );
  }

  const subtitle = listingTitle
    ? peerName
      ? t('swapChat.subtitleWithPeer', { title: listingTitle, peer: peerName })
      : listingTitle
    : t('swapChat.subtitleDefault');

  return (
    <Screen style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={leaveSwapOfferChat} style={styles.closeBtn} hitSlop={12}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.title}>{t('swapChat.title')}</Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          </View>
          <TouchableOpacity onPress={leaveSwapOfferChat} style={styles.backLink}>
            <Text style={styles.back}>{t('swapChat.leave')}</Text>
          </TouchableOpacity>
        </View>
        {!chatOpen ? (
          <Text style={styles.closedHint}>{t('swapChat.closedHint')}</Text>
        ) : (
          <Text style={styles.hint}>{t('swapChat.negotiateHint')}</Text>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.accent} style={{ marginTop: Spacing[8] }} />
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior="padding"
          keyboardVerticalOffset={insets.top + 120}
        >
          <FlatList
            ref={listRef}
            data={rows}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.empty}>{t('swapChat.empty')}</Text>}
            renderItem={({ item }) =>
              item.kind === 'intro' ? (
                <View style={styles.introBubble}>
                  <Text style={styles.introLabel}>{t('swapChat.initialOfferLabel')}</Text>
                  <Text style={styles.introText}>{item.body}</Text>
                </View>
              ) : (
                <View
                  style={[styles.bubble, item.mine ? styles.bubbleMine : styles.bubbleTheirs]}
                >
                  <Text style={[styles.bubbleText, item.mine && styles.bubbleTextMine]}>
                    {item.body}
                  </Text>
                </View>
              )
            }
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          />
          {chatOpen ? (
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={text}
                onChangeText={setText}
                placeholder={t('swapChat.placeholder')}
                placeholderTextColor={Colors.textMuted}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
                onPress={() => void handleSend()}
                disabled={!text.trim() || sending}
              >
                <Text style={styles.sendText}>{t('swapChat.send')}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </KeyboardAvoidingView>
      )}
    </Screen>
  );
}

function useMemoStyles(Colors: ReturnType<typeof useThemeColors>) {
  return useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: Colors.background },
        flex: { flex: 1 },
        header: {
          paddingHorizontal: Spacing[4],
          paddingTop: Spacing[2],
          gap: Spacing[1],
          borderBottomWidth: 1,
          borderBottomColor: Colors.borderLight,
          paddingBottom: Spacing[3],
        },
        headerTop: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: Spacing[2],
        },
        headerTitles: { flex: 1, gap: 2 },
        closeBtn: {
          width: 36,
          height: 36,
          borderRadius: Radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: Colors.surfaceSecondary,
          borderWidth: 1,
          borderColor: Colors.border,
        },
        closeText: {
          ...Typography.labelLarge,
          color: Colors.textPrimary,
          lineHeight: 20,
        },
        backLink: {
          paddingTop: 6,
          paddingLeft: Spacing[1],
        },
        back: { ...Typography.labelMedium, color: Colors.accent },
        title: { ...Typography.headingMedium, color: Colors.textPrimary },
        subtitle: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
        hint: { ...Typography.caption, color: Colors.textMuted, lineHeight: 18 },
        closedHint: { ...Typography.caption, color: Colors.warning, lineHeight: 18 },
        list: { padding: Spacing[4], gap: Spacing[2], flexGrow: 1 },
        empty: {
          ...Typography.bodyMedium,
          color: Colors.textMuted,
          textAlign: 'center',
          marginTop: Spacing[8],
        },
        introBubble: {
          alignSelf: 'center',
          maxWidth: '92%',
          padding: Spacing[3],
          borderRadius: Radius.lg,
          backgroundColor: Colors.infoLight,
          borderWidth: 1,
          borderColor: Colors.border,
          marginBottom: Spacing[2],
        },
        introLabel: {
          ...Typography.caption,
          color: Colors.textMuted,
          marginBottom: 4,
          fontWeight: '700',
        },
        introText: { ...Typography.bodySmall, color: Colors.textPrimary, lineHeight: 20 },
        bubble: {
          maxWidth: '82%',
          padding: Spacing[3],
          borderRadius: Radius.lg,
        },
        bubbleMine: {
          alignSelf: 'flex-end',
          backgroundColor: Colors.accent,
        },
        bubbleTheirs: {
          alignSelf: 'flex-start',
          backgroundColor: Colors.surfaceSecondary,
          borderWidth: 1,
          borderColor: Colors.border,
        },
        bubbleText: { ...Typography.bodyMedium, color: Colors.textPrimary },
        bubbleTextMine: { color: Colors.textOnGold },
        inputRow: {
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: Spacing[2],
          padding: Spacing[4],
          borderTopWidth: 1,
          borderTopColor: Colors.borderLight,
          backgroundColor: Colors.surface,
        },
        input: {
          flex: 1,
          minHeight: 44,
          maxHeight: 120,
          borderWidth: 1,
          borderColor: Colors.border,
          borderRadius: Radius.lg,
          paddingHorizontal: Spacing[3],
          paddingVertical: textInputPaddingVertical,
          fontFamily: Typography.bodyMedium.fontFamily,
          fontSize: Typography.bodyMedium.fontSize,
          color: Colors.textPrimary,
          backgroundColor: Colors.card,
          ...readableTextInputStyle,
        },
        sendBtn: {
          backgroundColor: Colors.accent,
          paddingHorizontal: Spacing[4],
          paddingVertical: Spacing[3],
          borderRadius: Radius.lg,
        },
        sendBtnDisabled: { opacity: 0.45 },
        sendText: { ...Typography.labelMedium, color: Colors.textOnGold },
      }),
    [Colors]
  );
}
