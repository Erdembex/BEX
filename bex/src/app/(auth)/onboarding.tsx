import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ViewToken,
  StyleSheet,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/common/Screen';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography, Spacing, Radius } from '@/theme';
import { BRAND_NAVY, BRAND_GOLD_MID, BRAND_GOLD_VIVID, BRAND_NAVY_TEXT } from '@/theme/brand';
import { useTranslation } from '@/i18n';
import { markOnboardingComplete } from '@/lib/onboardingStorage';

const { width } = Dimensions.get('window');
const ART_HEIGHT = 280;
const MARK = require('../../../assets/branding/passla-mark-white.png');
const SLIDE_1 = require('../../../assets/branding/onboarding/slide-1.png');
const SLIDE_2 = require('../../../assets/branding/onboarding/slide-2.png');
const SLIDE_3 = require('../../../assets/branding/onboarding/slide-3.png');

const TEXT = BRAND_NAVY_TEXT;
const MUTED = 'rgba(240, 238, 233, 0.68)';

type Slide = {
  id: string;
  image: number;
  title: string;
  description: string;
};

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);

  const slides = useMemo<Slide[]>(
    () => [
      {
        id: '1',
        image: SLIDE_1,
        title: t('auth.onboarding.slide1Title'),
        description: t('auth.onboarding.slide1Desc'),
      },
      {
        id: '2',
        image: SLIDE_2,
        title: t('auth.onboarding.slide2Title'),
        description: t('auth.onboarding.slide2Desc'),
      },
      {
        id: '3',
        image: SLIDE_3,
        title: t('auth.onboarding.slide3Title'),
        description: t('auth.onboarding.slide3Desc'),
      },
    ],
    [t]
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
    <Screen style={styles.safe} edges={['left', 'right']}>
      <View style={[styles.container, { paddingTop: insets.top + Spacing[2] }]}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Image source={MARK} style={styles.mark} resizeMode="contain" accessibilityLabel="Passla" />
            <View>
              <Text style={styles.brandName}>PASSLA</Text>
              <Text style={styles.brandSlogan}>{t('auth.onboarding.slogan')}</Text>
            </View>
          </View>
          {!isLast ? (
            <TouchableOpacity onPress={skip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.skipText}>{t('common.skip')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.skipPlaceholder} />
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
              <View style={[styles.artWrap, { height: ART_HEIGHT }]}>
                <Image
                  source={item.image}
                  style={styles.art}
                  resizeMode="cover"
                  fadeDuration={0}
                />
              </View>
              <View style={styles.textBlock}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
              </View>
            </View>
          )}
        />

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing[4]) }]}>
          <View style={styles.dots}>
            {slides.map((slide, i) => (
              <View
                key={slide.id}
                style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]}
              />
            ))}
          </View>

          <View style={styles.navRow}>
            <TouchableOpacity onPress={skip} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.footerSkip}>{t('common.skip')}</Text>
            </TouchableOpacity>

            {isLast ? (
              <TouchableOpacity style={styles.startBtn} onPress={goNext} activeOpacity={0.85}>
                <Text style={styles.startLabel}>{t('common.getStarted')}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.nextBtn} onPress={goNext} activeOpacity={0.85}>
                <Ionicons name="arrow-forward" size={22} color={BRAND_NAVY} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BRAND_NAVY,
  },
  container: {
    flex: 1,
    backgroundColor: BRAND_NAVY,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[3],
    zIndex: 2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  mark: {
    width: 36,
    height: 36,
  },
  brandName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    letterSpacing: 1.4,
    color: TEXT,
  },
  brandSlogan: {
    ...Typography.caption,
    color: BRAND_GOLD_MID,
    marginTop: 2,
    letterSpacing: 0.6,
  },
  skipText: {
    ...Typography.labelMedium,
    color: MUTED,
  },
  skipPlaceholder: {
    width: 40,
  },
  slideList: {
    flex: 1,
  },
  slide: {
    flex: 1,
    paddingHorizontal: Spacing[5],
  },
  artWrap: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: '#04162E',
    marginBottom: Spacing[5],
  },
  art: {
    width: '100%',
    height: '100%',
  },
  textBlock: {
    gap: Spacing[3],
    paddingRight: Spacing[2],
  },
  title: {
    ...Typography.headingLarge,
    color: TEXT,
    fontSize: 26,
    lineHeight: 32,
  },
  description: {
    ...Typography.bodyMedium,
    color: MUTED,
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: Spacing[5],
    gap: Spacing[4],
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  dot: {
    height: 7,
    borderRadius: Radius.full,
  },
  dotActive: {
    width: 20,
    backgroundColor: BRAND_GOLD_MID,
  },
  dotInactive: {
    width: 7,
    backgroundColor: 'rgba(240, 238, 233, 0.22)',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerSkip: {
    ...Typography.labelLarge,
    color: MUTED,
  },
  nextBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BRAND_GOLD_VIVID,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtn: {
    minWidth: 120,
    height: 48,
    paddingHorizontal: Spacing[5],
    borderRadius: 24,
    backgroundColor: BRAND_GOLD_VIVID,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startLabel: {
    ...Typography.labelLarge,
    color: BRAND_NAVY,
    fontWeight: '700',
  },
});
