import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '@/components/ui';
import { Typography, Spacing, useThemeColors } from '@/theme';
import { t } from '@/i18n';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundaryInner extends Component<
  Props & { colors: ReturnType<typeof useThemeColors> },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    const Colors = this.props.colors;

    if (this.state.hasError) {
      return (
        <View style={[styles.wrap, { backgroundColor: Colors.background }]}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={[styles.title, { color: Colors.textPrimary }]}>{t('errorBoundary.title')}</Text>
          <Text style={[styles.body, { color: Colors.textSecondary }]}>{t('errorBoundary.body')}</Text>
          <Button title={t('errorBoundary.retry')} onPress={this.handleRetry} style={styles.btn} />
        </View>
      );
    }

    return this.props.children;
  }
}

export function ErrorBoundary({ children }: Props) {
  const colors = useThemeColors();
  return <ErrorBoundaryInner colors={colors}>{children}</ErrorBoundaryInner>;
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[6],
    gap: Spacing[3],
  },
  emoji: { fontSize: 40 },
  title: { ...Typography.headingMedium, textAlign: 'center' },
  body: {
    ...Typography.bodyMedium,
    textAlign: 'center',
    lineHeight: 22,
  },
  btn: { alignSelf: 'stretch', marginTop: Spacing[2] },
});
