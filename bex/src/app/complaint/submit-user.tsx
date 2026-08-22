import React from 'react';
import { ScrollView } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router, useLocalSearchParams } from 'expo-router';
import { BackHeader } from '@/components/navigation/BackHeader';
import { IndividualComplaintSubmitForm } from '@/components/complaint/IndividualComplaintSubmitForm';
import { useToast } from '@/components/common/Toast';
import { Spacing, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

export default function IndividualComplaintSubmitScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const { applicationId, applicationLabel } = useLocalSearchParams<{
    applicationId?: string;
    applicationLabel?: string;
  }>();
  const { showToast } = useToast();

  return (
    <Screen style={styles.safe}>
      <BackHeader title={t('complaintSubmitScreen.userTitle')} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <IndividualComplaintSubmitForm
          initialApplicationId={applicationId ? String(applicationId) : ''}
          initialApplicationLabel={applicationLabel ? String(applicationLabel) : ''}
          onSuccess={() => {
            showToast(t('complaintSubmitScreen.userSuccessToast'));
            if (router.canGoBack()) router.back();
            else router.replace('/(business)/panel' as never);
          }}
        />
      </ScrollView>
    </Screen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing[5], paddingBottom: Spacing[10] },
}));
