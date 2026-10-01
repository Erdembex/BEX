import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { markOnboardingComplete } from '@/lib/onboardingStorage';
import { ONBOARDING_STEPS } from '@/components/onboarding/onboardingSteps';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { OnboardingStepContent } from '@/components/onboarding/OnboardingStepContent';
import { OnboardingFooter } from '@/components/onboarding/OnboardingFooter';
import { useOnboardingLayout } from '@/components/onboarding/onboardingTheme';
import { Screen } from '@/components/common/Screen';
import { createThemedStyles } from '@/theme';

const STEP_COUNT = ONBOARDING_STEPS.length;

type Destination = '/(auth)/login' | '/(auth)/register';

export default function OnboardingScreen() {
  const styles = useScreenStyles();
  const { IS_COMPACT_HEIGHT } = useOnboardingLayout();
  const [currentStep, setCurrentStep] = useState(0);

  const step = ONBOARDING_STEPS[currentStep];
  const isLast = currentStep === STEP_COUNT - 1;

  const finishOnboarding = useCallback(async (destination: Destination) => {
    await markOnboardingComplete();
    router.replace(destination);
  }, []);

  const goNext = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, STEP_COUNT - 1));
  }, []);

  const goBack = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentStep === 0) return false;
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [currentStep, goBack]);

  const body = (
    <>
      <OnboardingStepContent step={step} />
      <OnboardingFooter
        isLast={isLast}
        onNext={goNext}
        onRegister={() => void finishOnboarding('/(auth)/register')}
        onLogin={() => void finishOnboarding('/(auth)/login')}
      />
    </>
  );

  return (
    <Screen style={styles.screen}>
      <OnboardingHeader
        currentStep={currentStep}
        stepCount={STEP_COUNT}
        onSkip={isLast ? undefined : () => void finishOnboarding('/(auth)/login')}
      />

      {IS_COMPACT_HEIGHT ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {body}
        </ScrollView>
      ) : (
        <View style={styles.flex}>{body}</View>
      )}
    </Screen>
  );
}

const useScreenStyles = createThemedStyles((Colors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    flex: {
      flex: 1,
      minHeight: 0,
    },
    scroll: {
      flexGrow: 1,
    },
  })
);
