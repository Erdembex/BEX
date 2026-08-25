import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { Redirect, router } from 'expo-router';
import { isAuthEmulatorActive } from '@/lib/firebase';
import { shouldUseDemoData } from '@/lib/devMode';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { Button } from '@/components/ui';

const STORAGE_CONSOLE =
  'https://console.firebase.google.com/project/bexcursor/storage';
const BLAZE_CONSOLE =
  'https://console.firebase.google.com/project/bexcursor/usage/details';

type Step = {
  phase: string;
  title: string;
  items: string[];
  done?: boolean;
};

const STEPS: Step[] = [
  {
    phase: 'Şimdi',
    title: 'Geliştirme (senin yaptığın)',
    done: true,
    items: [
      'Terminal 1: cd bex && npm run emulators',
      'Terminal 2: cd bex && npx expo start',
      'Storage emülatörü için Java gerekir — npm run emulators:storage',
      'Kayıt ol, görev al, teslim et, admin onayı, kupon akışını test et',
      'App Check şu an gerekmez — atla',
    ],
  },
  {
    phase: '1',
    title: 'Firebase kurallarını yayınla',
    done: true,
    items: [
      '✓ Firestore kuralları + indeksler canlıya alındı (portföy dahil)',
      'İşletmeler kullanıcı portföyünü okuyabilir — kurallar güncel',
      'KYC evrakları için: Console → Storage → Get Started, sonra npm run deploy:storage',
      'Canlı Firestore boşsa: Admin panel → Demo içerik yükle',
    ],
  },
  {
    phase: '1b',
    title: 'Storage (KYC + teslim fotoğrafları)',
    items: [
      'Yerel: npm run emulators (Auth, Java gerekmez)',
      'Foto/KYC emülatörü: Java kur + npm run emulators:storage',
      'Canlı: Console → Storage → Get Started, sonra npm run deploy:storage',
      'Kurallar hazır — işletme/admin okur, sahte yükleme engelli',
    ],
  },
  {
    phase: '2',
    title: 'Cloud Functions (kupon güvenliği)',
    items: [
      'Firebase Console → Blaze plana geç',
      'https://console.firebase.google.com/project/bexcursor/usage/details',
      'Java JDK 17+ kur, sonra: npm run deploy:functions',
      'Emulator: npm run emulators:full (Java gerekir)',
    ],
  },
  {
    phase: '3',
    title: 'App Check (yayına çıkmadan önce)',
    items: [
      'Firebase Console → App Check → uygulamayı kaydet',
      'Debug token al, .env dosyasına EXPO_PUBLIC_APP_CHECK_DEBUG_TOKEN yaz',
      'Test et, sonra Firestore/Storage için Enforcement aç',
    ],
  },
  {
    phase: '4',
    title: 'Mağaza (App Store / Play Store)',
    items: [
      'npx eas login && npx eas init',
      'Gizlilik politikası URL’si (app.json → extra.privacyPolicyUrl)',
      'npm run build:preview ile test APK/IPA',
      'npm run build:production ile mağaza build’i',
    ],
  },
];

export default function SetupGuideScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const demoMode = shouldUseDemoData();
  const emulator = isAuthEmulatorActive();

  // Yayın derlemesinde deep link ile açılmasın.
  if (!__DEV__) {
    return <Redirect href="/" />;
  }

  return (
    <Screen style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Yayın Checklist</Text>
        <Text style={styles.subtitle}>
          Önce uygulama fazlarını bitir. Storage ve Blaze en sona — canlı foto/KYC ve kupon
          güvenliği için gerekli.
        </Text>

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Şu anki mod</Text>
          <Text style={styles.statusLine}>
            {emulator ? '🟢 Auth emulator bağlı' : '🔴 Emulator kapalı'}
          </Text>
          <Text style={styles.statusLine}>
            {demoMode ? '📦 Demo veri (bellekte)' : '☁️ Canlı Firestore'}
          </Text>
        </View>

        {STEPS.map((step) => (
          <View key={step.phase} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.phaseBadge, step.done && styles.phaseDone]}>
                <Text style={[styles.phaseText, step.done && styles.phaseTextDone]}>
                  {step.done ? '✓' : step.phase}
                </Text>
              </View>
              <Text style={styles.cardTitle}>{step.title}</Text>
            </View>
            {step.items.map((item, i) => (
              <View key={i} style={styles.itemRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.itemText}>{item}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.note}>
          <Text style={styles.noteText}>
            Sorun yaşarsan önce emulators terminalinin açık olduğundan emin ol, sonra uygulamayı
            yenile (r).
          </Text>
        </View>

        <View style={styles.actionCard}>
          <Text style={styles.actionTitle}>Sonra: Firebase altyapısı</Text>
          <Text style={styles.actionText}>
            Uygulama fazları bittiğinde Storage (foto/KYC) ve Blaze + Functions (canlı kupon
            güvenliği) açılır. Hazır olunca «storage açıldı» veya «blaze açıldı» yazman yeterli.
          </Text>
          <Button
            title="Firebase Storage"
            variant="outline"
            size="md"
            onPress={() => Linking.openURL(STORAGE_CONSOLE)}
          />
          <Button
            title="Blaze Plan"
            variant="ghost"
            size="md"
            onPress={() => Linking.openURL(BLAZE_CONSOLE)}
          />
        </View>
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
  statusCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    gap: Spacing[1],
  },
  statusTitle: { ...Typography.labelLarge, color: Colors.textPrimary },
  statusLine: { ...Typography.bodySmall, color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing[2],
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], marginBottom: Spacing[1] },
  phaseBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseDone: { backgroundColor: Colors.success },
  phaseText: { ...Typography.caption, fontWeight: '700', color: Colors.textSecondary },
  phaseTextDone: { color: Colors.background },
  cardTitle: { ...Typography.labelLarge, color: Colors.textPrimary, flex: 1 },
  itemRow: { flexDirection: 'row', gap: Spacing[2], paddingLeft: Spacing[1] },
  bullet: { ...Typography.bodySmall, color: Colors.primary, fontWeight: '700' },
  itemText: { ...Typography.bodySmall, color: Colors.textSecondary, flex: 1, lineHeight: 20 },
  note: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
  },
  noteText: { ...Typography.caption, color: Colors.textMuted, lineHeight: 18 },
  actionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing[3],
  },
  actionTitle: { ...Typography.labelLarge, color: Colors.textPrimary },
  actionText: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
}));
