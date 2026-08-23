import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageStyle,
  StyleProp,
  View,
  StyleSheet,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { buildAuthenticatedImageSource } from '@/lib/authenticatedImage';
import { useThemeColors } from '@/theme';

const MIN_SCALE = 1;
const MAX_SCALE = 4;

type ZoomableImageProps = {
  uri: string;
  style?: StyleProp<ImageStyle>;
};

export function ZoomableImage({ uri, style }: ZoomableImageProps) {
  const Colors = useThemeColors();
  const [source, setSource] = useState<{ uri: string; headers?: Record<string, string> } | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSource(null);
    buildAuthenticatedImageSource(uri).then((next) => {
      if (cancelled || !next || typeof next === 'number') return;
      setSource(next as { uri: string; headers?: Record<string, string> });
    });
    return () => {
      cancelled = true;
    };
  }, [uri]);

  const resetTransform = () => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  useEffect(() => {
    resetTransform();
  }, [uri]);

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      const next = savedScale.value * event.scale;
      scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
    })
    .onEnd(() => {
      if (scale.value <= MIN_SCALE) {
        scale.value = withTiming(MIN_SCALE);
        savedScale.value = MIN_SCALE;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        return;
      }
      if (scale.value >= MAX_SCALE) {
        scale.value = withTiming(MAX_SCALE);
        savedScale.value = MAX_SCALE;
        return;
      }
      savedScale.value = scale.value;
    });

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      if (scale.value <= MIN_SCALE) return;
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > MIN_SCALE) {
        scale.value = withTiming(MIN_SCALE);
        savedScale.value = MIN_SCALE;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        return;
      }
      scale.value = withTiming(2);
      savedScale.value = 2;
    });

  const gesture = Gesture.Simultaneous(pinch, pan, doubleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (!source) {
    return (
      <View style={[style, styles.loadingWrap, { backgroundColor: Colors.borderLight }]}>
        <ActivityIndicator size="large" color={Colors.textMuted} />
      </View>
    );
  }

  return (
    <GestureDetector gesture={gesture}>
      <View style={style}>
        <Animated.Image
          source={source}
          style={[StyleSheet.absoluteFillObject, animatedStyle]}
          resizeMode="contain"
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
        />
        {loading ? (
          <View style={[StyleSheet.absoluteFillObject, styles.loadingWrap]}>
            <ActivityIndicator size="large" color={Colors.textMuted} />
          </View>
        ) : null}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
