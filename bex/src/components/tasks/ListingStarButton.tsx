import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { showLoginRequiredAlert } from '@/lib/loginRequiredPrompt';
import { useSavedListingsStore } from '@/store/savedListingsStore';
import { useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

type ListingStarButtonProps = {
  listingId: string;
  size?: number;
};

export function ListingStarButton({ listingId, size = 22 }: ListingStarButtonProps) {
  const { t } = useTranslation();
  const Colors = useThemeColors();
  const { firebaseUser } = useAuthStore();
  const saved = useSavedListingsStore((s) => s.ids.includes(listingId));
  const toggle = useSavedListingsStore((s) => s.toggle);

  const onPress = async () => {
    if (!firebaseUser?.uid) {
      showLoginRequiredAlert();
      return;
    }
    await toggle(listingId);
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={styles.hit}
      accessibilityRole="button"
      accessibilityLabel={saved ? t('savedListings.unsave') : t('savedListings.save')}
    >
      <Ionicons
        name={saved ? 'star' : 'star-outline'}
        size={size}
        color={saved ? Colors.accent : Colors.iconMuted}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  hit: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
