import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router } from 'expo-router';
import { API_BASE_URL } from '@/lib/api/config';
import { useBackendHealth } from '@/hooks/useBackendHealth';
import { shouldUseDemoData } from '@/lib/devMode';
import { isAuthEmulatorActive } from '@/lib/firebase';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { Button } from '@/components/ui';

type TestStep = {
  id: string;
  title: string;
  steps: string[];
  needsBackend?: boolean;
};

const TEST_STEPS: TestStep[] = [
  {
    id: 'prep',
    title: '0 — Hazırlık',
    steps: [
      'Telefon ve bilgisayar aynı Wi‑Fi ağında olsun.',
      'Bilgisayarda: cd bex && npx expo start — QR kodu Expo Go ile tara.',
      'Backend açacaksan: takkas-backend klasöründe Spring Boot’u 8080 portunda başlat.',
      'bex/.env.local içinde EXPO_PUBLIC_API_BASE_URL bilgisayarının LAN IP’si olmalı (ör. http://192.168.1.102:8080).',
      'IP değiştiyse Expo’yu durdur (Ctrl+C) ve npx expo start ile yeniden başlat.',
    ],
  },
  {
    id: 'login',
    title: '1 — Giriş',
    needsBackend: true,
    steps: [
      'Uygulamayı aç; onboarding ekranından «Giriş yap».',
      'Admin test hesabı ile giriş yap (geliştirme ortamı).',
      'Üstte turuncu «Sunucuya ulaşılamıyor» bandı görürsen backend kapalı veya IP yanlış demektir.',
    ],
  },
  {
    id: 'location',
    title: '2 — Konum filtresi (Hepsi)',
    needsBackend: true,
    steps: [
      'Alt menüden Görevler sekmesine git.',
      'Konum filtresinde il seç; ilçe için «Hepsi» seçeneğini dene.',
      'Filtreyi değiştir, uygulamayı kapat-aç; filtre kaydedilmiş olmalı.',
      'Profil → Hesap Ayarları → Konum kartından profil şehrini güncelle.',
    ],
  },
  {
    id: 'home',
    title: '3 — Ana sayfa',
    needsBackend: true,
    steps: [
      'Ana Sayfa sekmesine dön.',
      '«Bölgedeki görevler · …» bölümünde filtreyle uyumlu görevler listelenmeli.',
      'Okunmamış bildirim varsa turuncu kart görünür; dokununca bildirimler açılır.',
    ],
  },
  {
    id: 'notifications',
    title: '4 — Bildirimler ikonu',
    steps: [
      'Ana sayfa veya Görevler ekranındaki zil ikonuna dokun.',
      'Bildirimler listesi açılmalı (unmatched route hatası olmamalı).',
      'Sol menüden de Bildirimler’e gidebilirsin.',
    ],
  },
  {
    id: 'task-detail',
    title: '5 — Görev detayı',
    needsBackend: true,
    steps: [
      'Görevler listesinden bir göreve dokun.',
      'Konum etiketi (il/ilçe) görünmeli.',
      'Başvur butonu ile başvuru formunu aç; portföy linki alanı varsa doldur.',
    ],
  },
  {
    id: 'phone',
    title: '6 — Telefon doğrulama (dev kodu)',
    needsBackend: true,
    steps: [
      'Profil veya kayıt akışında telefon doğrulama ekranına git.',
      'Kod gönder; backend dev modda ekranda doğrulama kodu görünür.',
      'Kodu gir ve doğrula.',
      'Not: Backend yeniden başlatılmadan bu özellik çalışmayabilir.',
    ],
  },
  {
    id: 'messages',
    title: '7 — Sohbet sekmesi',
    needsBackend: true,
    steps: [
      'Alt menüde 💬 Sohbet sekmesine git.',
      'Onaylı başvurun yoksa kilit ekranı görünür; onay sonrası sohbet listesi açılır.',
      'Bir sohbete gir, mesajları oku, geri dön — sekme rozeti ve «okunmamış mesaj» kartı sıfırlanmalı.',
      'Mesaj bildirimine dokununca doğrudan ilgili sohbet açılmalı.',
    ],
  },
  {
    id: 'messages-ws',
    title: '8 — Mesajlaşma (canlı)',
    needsBackend: true,
    steps: [
      'Onaylanmış bir başvuruda mesaj gönder.',
      'Karşı taraf veya ikinci cihazdan yanıt gelmeli.',
      'WebSocket kapalıysa uygulama otomatik polling ile yeniler.',
    ],
  },
  {
    id: 'trade',
    title: '9 — Takas',
    needsBackend: true,
    steps: [
      'Takas sekmesine git; aktif teklifler listelenmeli.',
      'Teklif ver veya kabul et; hata mesajları anlaşılır olmalı.',
    ],
  },
];

export default function ExpoTestGuideScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { reachable, checking, refresh } = useBackendHealth();
  const demoMode = shouldUseDemoData();
  const emulator = isAuthEmulatorActive();
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const doneCount = TEST_STEPS.filter((s) => checked[s.id]).length;

  return (
    <Screen style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Expo Test Rehberi</Text>
        <Text style={styles.subtitle}>
          Telefondan adım adım test et. Tamamladıkça kutucuğa dokun ({doneCount}/{TEST_STEPS.length}).
        </Text>

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Bağlantı durumu</Text>
          <Text style={styles.statusLine}>API: {API_BASE_URL}</Text>
          <Text style={styles.statusLine}>
            {emulator ? '🟢 Auth emulator' : '🔴 Emulator kapalı (REST)'}
          </Text>
          <Text style={styles.statusLine}>
            {demoMode ? '📦 Demo veri modu' : '☁️ REST / canlı API'}
          </Text>
          {!demoMode ? (
            <Text style={styles.statusLine}>
              Sunucu:{' '}
              {reachable === null
                ? '…'
                : reachable
                  ? '🟢 Erişilebilir'
                  : '🔴 Kapalı veya yanlış IP'}
            </Text>
          ) : null}
          {!demoMode ? (
            <Button
              title={checking ? 'Kontrol…' : 'Sunucuyu tekrar kontrol et'}
              variant="outline"
              size="sm"
              onPress={refresh}
            />
          ) : null}
        </View>

        {TEST_STEPS.map((step) => (
          <TouchableOpacity
            key={step.id}
            activeOpacity={0.85}
            onPress={() => toggle(step.id)}
            style={[styles.card, checked[step.id] && styles.cardDone]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.check, checked[step.id] && styles.checkDone]}>
                <Text style={styles.checkText}>{checked[step.id] ? '✓' : ''}</Text>
              </View>
              <Text style={styles.cardTitle}>{step.title}</Text>
              {step.needsBackend ? (
                <Text style={styles.badge}>API</Text>
              ) : null}
            </View>
            {step.steps.map((item, i) => (
              <View key={i} style={styles.itemRow}>
                <Text style={styles.bullet}>{i + 1}.</Text>
                <Text style={styles.itemText}>{item}</Text>
              </View>
            ))}
          </TouchableOpacity>
        ))}

        <View style={styles.note}>
          <Text style={styles.noteText}>
            Backend şu an kapalıysa yalnızca arayüz ve navigasyon test edilebilir. Giriş, görevler ve
            başvuru için sunucuyu açman gerekir.
          </Text>
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
    gap: Spacing[2],
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
  cardDone: { borderColor: Colors.success, opacity: 0.85 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], marginBottom: Spacing[1] },
  check: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  checkText: { ...Typography.caption, color: Colors.textInverse, fontWeight: '700' },
  cardTitle: { ...Typography.labelLarge, color: Colors.textPrimary, flex: 1 },
  badge: {
    ...Typography.caption,
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  itemRow: { flexDirection: 'row', gap: Spacing[2], paddingLeft: Spacing[1] },
  bullet: { ...Typography.bodySmall, color: Colors.primary, fontWeight: '700', width: 20 },
  itemText: { ...Typography.bodySmall, color: Colors.textSecondary, flex: 1, lineHeight: 20 },
  note: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
  },
  noteText: { ...Typography.caption, color: Colors.textMuted, lineHeight: 18 },
}));
