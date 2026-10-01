export type OnboardingStep = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  illustration: number;
};

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  {
    id: '1',
    titleKey: 'auth.onboarding.slide1Title',
    descriptionKey: 'auth.onboarding.slide1Desc',
    illustration: require('../../../assets/branding/onboarding/illustration-1.webp'),
  },
  {
    id: '2',
    titleKey: 'auth.onboarding.slide2Title',
    descriptionKey: 'auth.onboarding.slide2Desc',
    illustration: require('../../../assets/branding/onboarding/illustration-2.webp'),
  },
  {
    id: '3',
    titleKey: 'auth.onboarding.slide3Title',
    descriptionKey: 'auth.onboarding.slide3Desc',
    illustration: require('../../../assets/branding/onboarding/illustration-3.webp'),
  },
];
