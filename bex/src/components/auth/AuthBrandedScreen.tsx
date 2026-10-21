import React, { useEffect, useRef } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useResolvedSafeAreaInsets } from '@/components/common/Screen';
import { Spacing } from '@/theme';
import { AuthGlassBackground } from '@/components/auth/AuthGlassBackground';
import { AuthLoginHero } from '@/components/auth/AuthLoginHero';
import { useKeyboardOverlap } from '@/components/auth/useKeyboardOverlap';

type Props = {
  children: React.ReactNode;
  /** Uzun formlar (kayıt) — hero + sheet birlikte kayar */
  scrollBody?: boolean;
  /** Sheet içi ayrı kaydırma (giriş) */
  scrollSheet?: boolean;
  heroMinRatio?: number;
  onBack?: () => void;
  backLabel?: string;
  sheetStyle?: StyleProp<ViewStyle>;
  /** Kayıt gibi ekranlarda üst PASSLA alanı yok */
  showHero?: boolean;
  /** Düz lacivert sayfa. Duvar görseli ve beyaz kart yok. */
  bare?: boolean;
  /** Kısa formları dikeyde ortalar. Klavye açıkken üste yaslanır. */
  center?: boolean;
  headerRight?: React.ReactNode;
};

const NAVY = '#051F45';

export function AuthBrandedScreen({
  children,
  scrollBody = false,
  scrollSheet = false,
  heroMinRatio = 0.34,
  onBack,
  backLabel = 'Back',
  sheetStyle,
  showHero = true,
  bare = false,
  center = false,
  headerRight,
}: Props) {
  const insets = useResolvedSafeAreaInsets();
  const { height } = useWindowDimensions();
  const heroMin = Math.max(Math.round(height * heroMinRatio), 140);
  const { open: keyboardOpen, overlap: keyboardOverlap } = useKeyboardOverlap();
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);

  useEffect(() => {
    if (!scrollBody || !keyboardOpen || Platform.OS !== 'android') return undefined;
    const timer = setTimeout(() => {
      const input = TextInput.State.currentlyFocusedInput() as {
        measureInWindow?: (
          cb: (x: number, y: number, width: number, height: number) => void,
        ) => void;
      } | null;
      const scroll = scrollRef.current;
      if (!scroll || !input?.measureInWindow) return;
      const visibleBottom = Dimensions.get('window').height - keyboardOverlap - 24;
      input.measureInWindow((_x, y, _width, fieldHeight) => {
        const overflow = y + fieldHeight - visibleBottom;
        if (overflow > 4) {
          const next = scrollY.current + overflow;
          scrollY.current = next;
          scroll.scrollTo({ y: next, animated: true });
        }
      });
    }, 60);
    return () => clearTimeout(timer);
  }, [keyboardOpen, keyboardOverlap, scrollBody]);

  const hero = showHero ? (
    <View style={[styles.hero, { minHeight: heroMin, paddingTop: insets.top + Spacing[2] }]}>
      <AuthLoginHero />
    </View>
  ) : (
    <View
      style={{
        height: keyboardOpen ? insets.top + Spacing[1] : insets.top + Spacing[10],
      }}
    />
  );

  const sheetInner = scrollSheet ? (
    <ScrollView
      style={styles.sheetScroll}
      contentContainerStyle={[
        styles.sheetInner,
        { paddingBottom: insets.bottom + Spacing[5] },
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.sheetInner, { paddingBottom: insets.bottom + Spacing[5] }]}>{children}</View>
  );

  const sheet = (
    <View style={[styles.sheet, sheetStyle]}>
      {sheetInner}
    </View>
  );

  const bareBody = (
    <ScrollView
      ref={scrollRef}
      style={styles.flex}
      contentContainerStyle={[
        styles.bare,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + Spacing[6] },
        center && !keyboardOpen && styles.bareCenter,
        keyboardOpen && { paddingBottom: insets.bottom + Spacing[8] },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      onScroll={(event) => {
        scrollY.current = event.nativeEvent.contentOffset.y;
      }}
      scrollEventThrottle={16}
    >
      {children}
    </ScrollView>
  );

  const body = bare ? bareBody : scrollBody ? (
    <ScrollView
      ref={scrollRef}
      style={styles.flex}
      contentContainerStyle={[
        styles.scrollBodyGrow,
        keyboardOpen && { paddingBottom: Spacing[8] },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      onScroll={(event) => {
        scrollY.current = event.nativeEvent.contentOffset.y;
      }}
      scrollEventThrottle={16}
    >
      {hero}
      {sheet}
    </ScrollView>
  ) : (
    <View style={styles.flex}>
      {hero}
      {sheet}
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {bare ? null : <AuthGlassBackground />}

      {onBack ? (
        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + Spacing[2] }]}
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={backLabel}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      ) : null}

      {headerRight ? (
        <View style={[styles.headerRight, { top: insets.top + Spacing[2] }]}>{headerRight}</View>
      ) : null}

      <KeyboardAvoidingView
        style={[styles.flex, keyboardOverlap > 0 ? { paddingBottom: keyboardOverlap } : null]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {body}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: NAVY,
  },
  flex: {
    flex: 1,
    minHeight: 0,
  },
  scrollBodyGrow: {
    flexGrow: 1,
  },
  hero: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[3],
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    flexShrink: 0,
    alignSelf: 'stretch',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  sheetScroll: {
    flexGrow: 0,
  },
  sheetInner: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[6],
    gap: Spacing[3],
  },
  bare: {
    paddingHorizontal: 24,
    flexGrow: 1,
  },
  bareCenter: {
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    left: Spacing[4],
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    position: 'absolute',
    right: Spacing[5],
    zIndex: 10,
    height: 40,
    justifyContent: 'center',
  },
});
