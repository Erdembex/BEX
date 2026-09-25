import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, BackHandler, Easing, PanResponder, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { markOnboardingComplete } from '@/lib/onboardingStorage';
import { ONBOARDING_STEPS } from '@/components/onboarding/onboardingSteps';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { OnboardingStepContent } from '@/components/onboarding/OnboardingStepContent';
import { OnboardingFooter } from '@/components/onboarding/OnboardingFooter';
import { IS_COMPACT_HEIGHT, rs } from '@/components/onboarding/onboardingTheme';

const STEP_COUNT = ONBOARDING_STEPS.length;
const SLIDE_DISTANCE = rs(28);
const OUT_MS = 170;
const IN_MS = 260;
const SWIPE_THRESHOLD = 50;

type Destination = '/(auth)/login' | '/(auth)/register';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const background = useRef(new Animated.Value(0)).current;
  const animating = useRef(false);

  const step = ONBOARDING_STEPS[currentStep];
  const isLast = currentStep === STEP_COUNT - 1;

  const finishOnboarding = useCallback(async (destination: Destination) => {
    await markOnboardingComplete();
    router.replace(destination);
  }, []);

  const goToStep = useCallback(
    (nextStep: number) => {
      if (animating.current || nextStep < 0 || nextStep >= STEP_COUNT) return;
      animating.current = true;
      const direction = nextStep > currentStep ? 1 : -1;

      Animated.timing(background, {
        toValue: nextStep,
        duration: OUT_MS + IN_MS,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start();

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: OUT_MS,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -SLIDE_DISTANCE * direction,
          duration: OUT_MS,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep(nextStep);
        translateX.setValue(SLIDE_DISTANCE * direction);
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: IN_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: 0,
            duration: IN_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start(() => {
          animating.current = false;
        });
      });
    },
    [background, currentStep, opacity, translateX]
  );

  const goNext = useCallback(() => goToStep(currentStep + 1), [currentStep, goToStep]);
  const goBack = useCallback(() => goToStep(currentStep - 1), [currentStep, goToStep]);

  const swipeHandlers = useRef({ goNext, goBack });
  swipeHandlers.current = { goNext, goBack };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderRelease: (_, g) => {
          if (g.dx <= -SWIPE_THRESHOLD) swipeHandlers.current.goNext();
          else if (g.dx >= SWIPE_THRESHOLD) swipeHandlers.current.goBack();
        },
      }),
    []
  );

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentStep === 0) return false;
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [currentStep, goBack]);

  return (
    <View style={styles.root} {...panResponder.panHandlers}>
      <StatusBar style="dark" />
      {ONBOARDING_STEPS.map((s, i) => (
        <Animated.View
          key={s.id}
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: background.interpolate({
                inputRange: [i - 1, i, i + 1],
                outputRange: [0, 1, 0],
                extrapolate: 'clamp',
              }),
            },
          ]}
        >
          <LinearGradient
            colors={s.background}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ))}

      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + (IS_COMPACT_HEIGHT ? rs(12) : rs(22)),
            paddingBottom: Math.max(insets.bottom, rs(14)) + (IS_COMPACT_HEIGHT ? rs(16) : rs(30)),
          },
        ]}
      >
        <OnboardingHeader
          currentStep={currentStep}
          stepCount={STEP_COUNT}
          onSkip={isLast ? undefined : () => void finishOnboarding('/(auth)/login')}
        />

        <Animated.View style={[styles.content, { opacity, transform: [{ translateX }] }]}>
          <OnboardingStepContent step={step} />
        </Animated.View>

        <OnboardingFooter
          isLast={isLast}
          onNext={goNext}
          onRegister={() => void finishOnboarding('/(auth)/register')}
          onLogin={() => void finishOnboarding('/(auth)/login')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F3F1FE',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
