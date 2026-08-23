import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PasslaLogo } from '@/components/ui';
import { Typography, Spacing, Radius, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

type ValueCard = {
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  bodyKey: string;
};

const VALUES: ValueCard[] = [
  { icon: 'gift-outline', titleKey: 'about.values.exchange.title', bodyKey: 'about.values.exchange.body' },
  { icon: 'people-outline', titleKey: 'about.values.community.title', bodyKey: 'about.values.community.body' },
  { icon: 'shield-checkmark-outline', titleKey: 'about.values.trust.title', bodyKey: 'about.values.trust.body' },
  { icon: 'sparkles-outline', titleKey: 'about.values.local.title', bodyKey: 'about.values.local.body' },
];

export default function AboutScreen() {
  const { t } = useTranslation();
  const Colors = useThemeColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);

  return (
    <Screen style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>

        <LinearGradient
          colors={[Colors.gradientBlue, Colors.gradientMid]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <PasslaLogo size="sm" showTagline centered />
          <Text style={styles.heroTitle}>{t('about.heroTitle')}</Text>
          <Text style={styles.heroSubtitle}>{t('about.heroSubtitle')}</Text>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('about.whoWeAreTitle')}</Text>
          <Text style={styles.body}>{t('about.whoWeAreBody')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('about.missionTitle')}</Text>
          <Text style={styles.body}>{t('about.missionBody')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('about.howItWorksTitle')}</Text>
          {[1, 2, 3, 4].map((step) => (
            <View key={step} style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{step}</Text>
              </View>
              <Text style={styles.stepText}>{t(`about.howStep${step}` as 'about.howStep1')}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('about.valuesTitle')}</Text>
          {VALUES.map((item) => (
            <View key={item.titleKey} style={styles.valueCard}>
              <View style={styles.valueIconWrap}>
                <Ionicons name={item.icon} size={22} color={Colors.primary} />
              </View>
              <View style={styles.valueTextWrap}>
                <Text style={styles.valueTitle}>{t(item.titleKey)}</Text>
                <Text style={styles.valueBody}>{t(item.bodyKey)}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>{t('about.footer')}</Text>
      </ScrollView>
    </Screen>
  );
}

function createStyles(Colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.background },
    scroll: { paddingBottom: Spacing[10] },
    back: { paddingHorizontal: Spacing[5], paddingTop: Spacing[3], paddingBottom: Spacing[2] },
    backText: { ...Typography.labelMedium, color: Colors.primary },
    hero: {
      marginHorizontal: Spacing[5],
      borderRadius: Radius.xl,
      padding: Spacing[6],
      alignItems: 'center',
      gap: Spacing[3],
    },
    heroTitle: {
      ...Typography.headingLarge,
      color: Colors.textPrimary,
      textAlign: 'center',
    },
    heroSubtitle: {
      ...Typography.bodyMedium,
      color: Colors.textSecondary,
      textAlign: 'center',
    },
    section: {
      paddingHorizontal: Spacing[5],
      paddingTop: Spacing[6],
      gap: Spacing[3],
    },
    sectionTitle: {
      ...Typography.headingMedium,
      color: Colors.textPrimary,
    },
    body: {
      ...Typography.bodyMedium,
      color: Colors.textSecondary,
      lineHeight: 24,
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing[3],
    },
    stepBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: Colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepBadgeText: {
      ...Typography.labelMedium,
      color: Colors.primary,
    },
    stepText: {
      ...Typography.bodyMedium,
      color: Colors.textSecondary,
      flex: 1,
      lineHeight: 22,
    },
    valueCard: {
      flexDirection: 'row',
      gap: Spacing[3],
      backgroundColor: Colors.card,
      borderRadius: Radius.lg,
      padding: Spacing[4],
      borderWidth: 1,
      borderColor: Colors.borderLight,
    },
    valueIconWrap: {
      width: 40,
      height: 40,
      borderRadius: Radius.md,
      backgroundColor: Colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    valueTextWrap: { flex: 1, gap: Spacing[1] },
    valueTitle: { ...Typography.labelLarge, color: Colors.textPrimary },
    valueBody: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
    footer: {
      ...Typography.caption,
      color: Colors.textMuted,
      textAlign: 'center',
      paddingHorizontal: Spacing[6],
      paddingTop: Spacing[8],
    },
  });
}
