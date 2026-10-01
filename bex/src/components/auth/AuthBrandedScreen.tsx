import React from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
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
};

const NAVY = '#17264F';

export function AuthBrandedScreen({
  children,
  scrollBody = false,
  scrollSheet = false,
  heroMinRatio = 0.34,
  onBack,
  backLabel = 'Back',
  sheetStyle,
  showHero = true,
}: Props) {
  const insets = useResolvedSafeAreaInsets();
  const { height } = useWindowDimensions();
  const heroMin = Math.max(Math.round(height * heroMinRatio), 140);

  const hero = showHero ? (
    <View style={[styles.hero, { minHeight: heroMin, paddingTop: insets.top + Spacing[2] }]}>
      <AuthLoginHero />
    </View>
  ) : (
    <View style={{ height: insets.top + Spacing[10] }} />
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

  const body = scrollBody ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollBodyGrow}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets
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
      <AuthGlassBackground />

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

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
  backBtn: {
    position: 'absolute',
    left: Spacing[4],
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
