import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ViewToken,
  StyleSheet,
  BackHandler,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/common/Screen';
import { router } from 'expo-router';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { BRAND_NAVY } from '@/theme/brand';
import { Button, PasslaLogo } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { markOnboardingComplete } from '@/lib/onboardingStorage';

const { width } = Dimensions.get('window');

type SlideIcon = keyof typeof Ionicons.glyphMap;

type Slide = {
  id: string;
  icon: SlideIcon;
  step: string;
  title: string;
  description: string;
  accentText: string;
  gradient: [string, string];
};

export default function OnboardingScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);

  const slides = useMemo<Slide[]>(
    () => [
      {
        id: '1',
        icon: 'sparkles',
        step: '01',
        title: t('auth.onboarding.slide1Title'),
        description: t('auth.onboarding.slide1Desc'),
        accentText: t('auth.onboarding.slide1Accent'),
        gradient: [Colors.primary, BRAND_NAVY],
      },
      {
        id: '2',
        icon: 'checkmark-done-circle',
        step: '02',
        title: t('auth.onboarding.slide2Title'),
        description: t('auth.onboarding.slide2Desc'),
        accentText: t('auth.onboarding.slide2Accent'),
        gradient: ['#007386', Colors.primary],
      },
      {
        id: '3',
        icon: 'qr-code',
        step: '03',
        title: t('auth.onboarding.slide3Title'),
        description: t('auth.onboarding.slide3Desc'),
        accentText: t('auth.onboarding.slide3Accent'),
        gradient: ['#2A559E', Colors.primary],
      },
    ],
    [t, Colors.primary]
  );

  const isLast = activeIndex === slides.length - 1;

  const finishOnboarding = useCallback(async (destination: '/(auth)/login') => {
    await markOnboardingComplete();
    router.replace(destination);
  }, []);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const goNext = () => {
    if (isLast) {
      void finishOnboarding('/(auth)/login');
      return;
    }
    const nextIndex = activeIndex + 1;
    flatListRef.current?.scrollToOffset({
      offset: width * nextIndex,
      animated: true,
    });
    setActiveIndex(nextIndex);
  };

  const skip = () => {
    void finishOnboarding('/(auth)/login');
  };

  const goBack = useCallback(() => {
    if (activeIndex <= 0) return;
    const prevIndex = activeIndex - 1;
    flatListRef.current?.scrollToOffset({
      offset: width * prevIndex,
      animated: true,
    });
    setActiveIndex(prevIndex);
  }, [activeIndex]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (activeIndex > 0) {
        goBack();
        return true;
      }
      return true;
    });
    return () => sub.remove();
  }, [activeIndex, goBack]);

  return (
    <Screen style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          {activeIndex > 0 ? (
            <TouchableOpacity
              onPress={goBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.backBtn}
            >
              <Ionicons name="chevron-back" size={22} color={Colors.textSecondary} />
              <Text style={styles.backText}>{t('common.back')}</Text>
            </TouchableOpacity>
          ) : (
            <PasslaLogo size="sm" />
          )}
          {!isLast ? (
            <TouchableOpacity onPress={skip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.skipText}>{t('common.skip')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.topBarSpacer} />
          )}
        </View>

        <FlatList
          ref={flatListRef}
          data={slides}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          style={styles.slideList}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          onScrollToIndexFailed={({ index }) => {
            flatListRef.current?.scrollToOffset({
              offset: width * index,
              animated: true,
            });
          }}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              <LinearGradient
                colors={item.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                <View style={styles.heroGlow} />
                <Text style={styles.stepLabel}>{item.step}</Text>
                <View style={styles.iconRing}>
                  <Ionicons name={item.icon} size={44} color="#FFF8E1" />
                </View>
              </LinearGradient>

              <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
                <View style={styles.accentCard}>
                  <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
                  <Text style={styles.accentText}>{item.accentText}</Text>
                </View>
              </View>
            </View>
          )}
        />

        <View style={styles.footer}>
          <View style={styles.dots}>
            {slides.map((slide, i) => (
              <View
                key={slide.id}
                style={[
                  styles.dot,
                  i === activeIndex ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>

          <View style={styles.buttons}>
            <Button
              title={isLast ? t('common.getStarted') : t('common.continue')}
              onPress={goNext}
            />

            {isLast ? (
              <TouchableOpacity
                style={styles.loginLink}
                onPress={() => void finishOnboarding('/(auth)/login')}
              >
                <Text style={styles.loginLinkText}>{t('auth.alreadyHaveAccount')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </Screen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[2],
    paddingBottom: Spacing[3],
  },
  topBarSpacer: {
    width: 48,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    minWidth: 48,
  },
  backText: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
  },
  skipText: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
  },
  slideList: {
    flex: 1,
  },
  slide: {
    flex: 1,
    paddingHorizontal: Spacing[6],
    gap: Spacing[6],
  },
  heroCard: {
    height: 240,
    borderRadius: Radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: Spacing[2],
  },
  heroGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius['2xl'],
  },
  stepLabel: {
    position: 'absolute',
    top: Spacing[4],
    left: Spacing[5],
    ...Typography.caption,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '700',
    letterSpacing: 2,
  },
  iconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: Spacing[4],
  },
  title: {
    ...Typography.displayMedium,
    color: Colors.textPrimary,
    lineHeight: 36,
  },
  description: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  accentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  accentText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[8],
    gap: Spacing[6],
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  dot: {
    height: 8,
    borderRadius: Radius.full,
  },
  dotActive: {
    width: 28,
    backgroundColor: Colors.primary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: Colors.border,
  },
  buttons: {
    gap: Spacing[3],
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: Spacing[2],
  },
  loginLinkText: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
  },
}));
