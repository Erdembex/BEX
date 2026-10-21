export type OnboardingStep = {
  id: string;
  titleKey: string;
  descriptionKey: string;
};

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  {
    id: '1',
    titleKey: 'auth.onboarding.slide1Title',
    descriptionKey: 'auth.onboarding.slide1Desc',
  },
  {
    id: '2',
    titleKey: 'auth.onboarding.slide2Title',
    descriptionKey: 'auth.onboarding.slide2Desc',
  },
  {
    id: '3',
    titleKey: 'auth.onboarding.slide3Title',
    descriptionKey: 'auth.onboarding.slide3Desc',
  },
];
