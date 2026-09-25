import { Dimensions } from 'react-native';

/** Referans tasarımdaki panel genişliği; tüm ölçüler buna göre ölçeklenir. */
const REFERENCE_WIDTH = 322;

const { width, height } = Dimensions.get('window');
const scale = Math.min(width / REFERENCE_WIDTH, 1.35);

export const rs = (size: number) => Math.round(size * scale);

/** Kısa ekranlarda (ör. 16:9 telefonlar) başlık ve boşluklar küçülür, illüstrasyona yer kalır. */
export const IS_COMPACT_HEIGHT = height < 720;

export const ONBOARDING_COLORS = {
  navy: '#17264F',
  body: '#1E293B',
  slogan: '#3B4668',
  progressInactive: '#C9CCE8',
  star: '#6B63C9',
} as const;
