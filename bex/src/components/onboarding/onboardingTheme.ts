import { Dimensions } from 'react-native';

/** Referans tasarımdaki panel genişliği; tüm ölçüler buna göre ölçeklenir. */
const REFERENCE_WIDTH = 322;

const { width, height } = Dimensions.get('window');
const scale = Math.min(width / REFERENCE_WIDTH, 1.35);

export const rs = (size: number) => Math.round(size * scale);

/** Kısa ekranlarda (ör. 16:9 telefonlar) başlık ve boşluklar küçülür, illüstrasyona yer kalır. */
export const IS_COMPACT_HEIGHT = height < 720;

/** Giriş duvarı ile aynı marka laciverti (#17264F). */
export const ONBOARDING_BG = ['#1A2F58', '#17264F', '#141F3F'] as const;

export const ONBOARDING_COLORS = {
  navy: '#17264F',
  title: '#FFFFFF',
  body: '#D1DAEF',
  slogan: '#9BAAC8',
  progressActive: '#FFFFFF',
  progressInactive: 'rgba(255, 255, 255, 0.24)',
  buttonFill: '#FFFFFF',
  buttonText: '#17264F',
  link: '#E8EDFA',
} as const;
