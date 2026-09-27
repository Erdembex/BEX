import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useTranslation } from '@/i18n';
import { pageReadableText } from '@/lib/pageLayout';
import { ONBOARDING_COLORS, useOnboardingTheme } from './onboardingTheme';

const SS_MARK = require('../../../assets/branding/splash-ss-white.png');
const SS_MARK_ASPECT = 2400 / 1403;

type Props = {
  currentStep: number;
  stepCount: number;
  onSkip?: () => void;
};

export function OnboardingHeader({ currentStep, stepCount, onSkip }: Props) {
  const { t } = useTranslation();
  const { rs, IS_COMPACT_HEIGHT } = useOnboardingTheme();

  const styles = useMemo(() => {
    const markHeight = IS_COMPACT_HEIGHT ? rs(64) : rs(78);
    return StyleSheet.create({
      wrap: {
        alignItems: 'center',
        alignSelf: 'stretch',
        paddingHorizontal: rs(20),
      },
      mark: {
        height: markHeight,
        width: markHeight * SS_MARK_ASPECT,
      },
      slogan: {
        marginTop: rs(10),
        fontFamily: 'Inter_600SemiBold',
        fontSize: Math.max(11, rs(10)),
        letterSpacing: Platform.OS === 'android' ? 0.6 : rs(1.2),
        color: ONBOARDING_COLORS.slogan,
        textAlign: 'center',
        alignSelf: 'stretch',
        paddingHorizontal: rs(36),
        ...pageReadableText,
      },
      progressRow: {
        marginTop: IS_COMPACT_HEIGHT ? rs(14) : rs(20),
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        width: '88%',
        maxWidth: 320,
        gap: rs(4),
      },
      segment: {
        flex: 1,
        borderRadius: 2,
      },
      segmentActive: {
        height: 3,
        backgroundColor: ONBOARDING_COLORS.progressActive,
      },
      segmentInactive: {
        height: 2,
        backgroundColor: ONBOARDING_COLORS.progressInactive,
      },
      skip: {
        position: 'absolute',
        top: 0,
        right: rs(22),
      },
      skipText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: rs(13),
        color: ONBOARDING_COLORS.slogan,
        ...pageReadableText,
      },
    });
  }, [IS_COMPACT_HEIGHT, rs]);

  return (
    <View style={styles.wrap}>
      <Image
        source={SS_MARK}
        style={styles.mark}
        resizeMode="contain"
        accessibilityLabel="Passla"
      />
      <Text
        style={styles.slogan}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.82}
      >
        {t('auth.onboarding.slogan')}
      </Text>
      <View
        style={styles.progressRow}
        accessibilityLabel={t('auth.onboarding.stepLabel', { current: currentStep + 1, total: stepCount })}
      >
        {Array.from({ length: stepCount }, (_, i) => (
          <View
            key={i}
            style={[styles.segment, i === currentStep ? styles.segmentActive : styles.segmentInactive]}
          />
        ))}
      </View>

      {onSkip ? (
        <TouchableOpacity
          style={styles.skip}
          onPress={onSkip}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
        >
          <Text style={styles.skipText}>{t('auth.onboarding.skip')}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
