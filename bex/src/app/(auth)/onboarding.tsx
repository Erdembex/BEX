import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { markOnboardingComplete } from '@/lib/onboardingStorage';
import { ONBOARDING_STEPS } from '@/components/onboarding/onboardingSteps';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { OnboardingStepContent } from '@/components/onboarding/OnboardingStepContent';
import { OnboardingFooter } from '@/components/onboarding/OnboardingFooter';
import { Screen } from '@/components/common/Screen';

const STEP_COUNT = ONBOARDING_STEPS.length;
const NAVY = '#051F45';

type Destination = '/(auth)/login' | '/(auth)/register';

export default function OnboardingScreen() {
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

  return (
    <Screen style={styles.screen}>
      <StatusBar style="light" />
      <OnboardingHeader
        onSkip={isLast ? undefined : () => void finishOnboarding('/(auth)/login')}
      />
      <View style={styles.flex}>
        <OnboardingStepContent step={step} />
      </View>
      <OnboardingFooter
        currentStep={currentStep}
        stepCount={STEP_COUNT}
        isLast={isLast}
        onNext={goNext}
        onRegister={() => void finishOnboarding('/(auth)/register')}
        onLogin={() => void finishOnboarding('/(auth)/login')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: NAVY,
  },
  flex: {
    flex: 1,
    minHeight: 0,
  },
});
