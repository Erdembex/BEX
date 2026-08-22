import React, { useRef, useState, useMemo } from 'react';
import { View, Text, FlatList, Dimensions, TouchableOpacity, ViewToken } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router } from 'expo-router';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { Button } from '@/components/ui';
import { useTranslation } from '@/i18n';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const slides = useMemo(
    () => [
      {
        id: '1',
        emoji: '🎯',
        title: t('auth.onboarding.slide1Title'),
        description: t('auth.onboarding.slide1Desc'),
        accentText: t('auth.onboarding.slide1Accent'),
        bg: Colors.background,
      },
      {
        id: '2',
        emoji: '⚡',
        title: t('auth.onboarding.slide2Title'),
        description: t('auth.onboarding.slide2Desc'),
        accentText: t('auth.onboarding.slide2Accent'),
        bg: Colors.background,
      },
      {
        id: '3',
        emoji: '🏆',
        title: t('auth.onboarding.slide3Title'),
        description: t('auth.onboarding.slide3Desc'),
        accentText: t('auth.onboarding.slide3Accent'),
        bg: Colors.background,
      },
    ],
    [t]
  );

  const isLast = activeIndex === slides.length - 1;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const goNext = () => {
    if (isLast) {
      router.replace('/(auth)/login');
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
    router.replace('/(auth)/login');
  };

  return (
    <Screen style={styles.safe}>
      <View style={styles.container}>
        {/* Skip butonu */}
        {!isLast && (
          <TouchableOpacity style={styles.skip} onPress={skip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.skipText}>{t('common.skip')}</Text>
          </TouchableOpacity>
        )}

        {/* Slide listesi */}
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
              {/* Emoji büyük alan */}
              <View style={styles.emojiContainer}>
                <View style={styles.emojiBg}>
                  <Text style={styles.emoji}>{item.emoji}</Text>
                </View>
              </View>

              {/* Metin alanı */}
              <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>

                <View style={styles.accentPill}>
                  <Text style={styles.accentText}>{item.accentText}</Text>
                </View>
              </View>
            </View>
          )}
        />

        {/* Alt kısım */}
        <View style={styles.footer}>
          {/* Dot indicators */}
          <View style={styles.dots}>
            {slides.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === activeIndex ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>

          {/* Butonlar */}
          <View style={styles.buttons}>
            <Button
              title={isLast ? t('common.getStarted') : t('common.continue')}
              onPress={goNext}
            />

            {isLast && (
              <TouchableOpacity
                style={styles.loginLink}
                onPress={() => router.replace('/(auth)/login')}
              >
                <Text style={styles.loginLinkText}>{t('auth.alreadyHaveAccount')}</Text>
              </TouchableOpacity>
            )}
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
  slideList: {
    flex: 1,
  },
  skip: {
    position: 'absolute',
    top: Spacing[4],
    right: Spacing[5],
    zIndex: 10,
    padding: Spacing[2],
  },
  skipText: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
  },
  slide: {
    flex: 1,
    paddingHorizontal: Spacing[6],
  },
  emojiContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing[12],
  },
  emojiBg: {
    width: 160,
    height: 160,
    borderRadius: Radius['2xl'],
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 72,
  },
  textContainer: {
    paddingBottom: Spacing[6],
    gap: Spacing[4],
  },
  title: {
    ...Typography.displayMedium,
    color: Colors.textPrimary,
  },
  description: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  accentPill: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderRadius: Radius.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  accentText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
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
