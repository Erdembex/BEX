import React from 'react';
import { Platform, StatusBar, View, type StyleProp, type ViewStyle } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
  type Edge,
} from 'react-native-safe-area-context';

const TAB_BAR_BASE_HEIGHT = 58;

/** Android APK'da insets bazen 0 gelir — minimum güvenli alan. */
export function useResolvedSafeAreaInsets() {
  const insets = useSafeAreaInsets();
  const androidStatus = StatusBar.currentHeight ?? 28;
  const androidBottomFallback = 20;

  return {
    top: Math.max(insets.top, Platform.OS === 'android' ? androidStatus : 0),
    bottom: Math.max(insets.bottom, Platform.OS === 'android' ? androidBottomFallback : 0),
    left: insets.left,
    right: insets.right,
  };
}

type ScreenProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: Edge[];
};

function InsetPadding({
  children,
  style,
  edges = ['top', 'bottom', 'left', 'right'],
}: ScreenProps) {
  const insets = useResolvedSafeAreaInsets();
  const paddingStyle: ViewStyle = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  return (
    <View style={[{ flex: 1 }, paddingStyle, style]}>
      {children}
    </View>
  );
}

/** Tam ekran — üst/alt/sağ/sol güvenli alan (Android APK dahil). */
export function Screen({ children, style, edges = ['top', 'bottom', 'left', 'right'] }: ScreenProps) {
  return (
    <InsetPadding style={style} edges={edges}>
      {children}
    </InsetPadding>
  );
}

/** Alt tab bar olan ekranlar — alt inset tab bar tarafından verilir. */
export function TabScreen({ children, style }: Omit<ScreenProps, 'edges'>) {
  return (
    <InsetPadding style={style} edges={['top', 'left', 'right']}>
      {children}
    </InsetPadding>
  );
}

/** Modal / klavye üstü katmanlar için orijinal SafeAreaView. */
export function SafeScreen({ children, style, edges }: ScreenProps) {
  return (
    <SafeAreaView style={[{ flex: 1 }, style]} edges={edges ?? ['top', 'bottom', 'left', 'right']}>
      {children}
    </SafeAreaView>
  );
}

/** ScrollView / FlatList contentContainerStyle için alt boşluk (tab bar + gesture bar). */
export function useTabBarBottomPadding(extra = 24): number {
  const insets = useResolvedSafeAreaInsets();
  return TAB_BAR_BASE_HEIGHT + insets.bottom + extra;
}

export function useTabBarStyle(backgroundColor: string, borderColor: string) {
  const insets = useResolvedSafeAreaInsets();
  return {
    backgroundColor,
    borderTopColor: borderColor,
    borderTopWidth: 1,
    paddingTop: 4,
    paddingBottom: insets.bottom,
    height: TAB_BAR_BASE_HEIGHT + insets.bottom,
  } as const;
}
