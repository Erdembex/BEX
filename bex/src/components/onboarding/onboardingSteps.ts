export type OnboardingStep = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  illustration: number;
  background: readonly [string, string, string];
};

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  {
    id: '1',
    titleKey: 'auth.onboarding.slide1Title',
    descriptionKey: 'auth.onboarding.slide1Desc',
    illustration: require('../../../assets/branding/onboarding/illustration-1.webp'),
    background: ['#E9E5FD', '#F3F1FE', '#EEEBFC'],
  },
  {
    id: '2',
    titleKey: 'auth.onboarding.slide2Title',
    descriptionKey: 'auth.onboarding.slide2Desc',
    illustration: require('../../../assets/branding/onboarding/illustration-2.webp'),
    background: ['#FEFAEF', '#FEF9F5', '#FFF6EA'],
  },
  {
    id: '3',
    titleKey: 'auth.onboarding.slide3Title',
    descriptionKey: 'auth.onboarding.slide3Desc',
    illustration: require('../../../assets/branding/onboarding/illustration-3.webp'),
    background: ['#DDE6FD', '#EDEFFC', '#EEEDFD'],
  },
];
