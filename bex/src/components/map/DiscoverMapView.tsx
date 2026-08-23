import { Platform } from 'react-native';

export { DiscoverMapView } from Platform.OS === 'web'
  ? './DiscoverMapView.web'
  : './DiscoverMapView.native';
export type { MapBusinessPin } from './types';
