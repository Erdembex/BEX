import { installGlobalFontScalingLimits } from './src/lib/androidUi';

// Sistem yazı boyutu (iOS/Android) — max ~%120; layout taşmasını azaltır
installGlobalFontScalingLimits();

import 'expo-router/entry';
