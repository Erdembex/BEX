import React, { useMemo, useState } from 'react';
import { Modal, View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

type LocationSelectorModalProps = {
  visible: boolean;
  title: string;
  items: string[];
  selected?: string | null;
  onSelect: (item: string) => void;
  onClose: () => void;
  searchPlaceholder?: string;
};

export function LocationSelectorModal({
  visible,
  title,
  items,
  selected,
  onSelect,
  onClose,
  searchPlaceholder,
}: LocationSelectorModalProps) {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const resolvedSearchPlaceholder = searchPlaceholder ?? t('locationSelectorModal.searchPlaceholder');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr-TR');
    if (!q) return items;
    return items.filter((item) => item.toLocaleLowerCase('tr-TR').includes(q));
  }, [items, query]);

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <Screen style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={12}>
              <Text style={styles.close}>{t('locationSelectorModal.close')}</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.search}
            placeholder={resolvedSearchPlaceholder}
            placeholderTextColor={Colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="words"
            clearButtonMode="while-editing"
          />

          <Text style={styles.count}>{t('locationSelectorModal.resultCount', { count: filtered.length })}</Text>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.empty}>{t('locationSelectorModal.empty')}</Text>
            }
            renderItem={({ item }) => {
              const active = selected === item;
              return (
                <TouchableOpacity
                  style={[styles.row, active && styles.rowActive]}
                  onPress={() => {
                    onSelect(item);
                    setQuery('');
                  }}
                >
                  <Text style={[styles.rowText, active && styles.rowTextActive]}>{item}</Text>
                  {active ? <Text style={styles.check}>✓</Text> : null}
                </TouchableOpacity>
              );
            }}
          />
        </KeyboardAvoidingView>
      </Screen>
    </Modal>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: { ...Typography.headingMedium, color: Colors.textPrimary },
  close: { ...Typography.labelMedium, color: Colors.primary, fontWeight: '700' },
  search: {
    marginHorizontal: Spacing[5],
    marginTop: Spacing[3],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    ...Typography.bodyMedium,
  },
  count: {
    ...Typography.caption,
    color: Colors.textTertiary,
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[2],
  },
  list: { paddingHorizontal: Spacing[5], paddingBottom: Spacing[8] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  rowActive: { backgroundColor: Colors.primaryLight },
  rowText: { ...Typography.bodyMedium, color: Colors.textPrimary, flex: 1 },
  rowTextActive: { color: Colors.primaryDark, fontWeight: '700' },
  check: { color: Colors.primary, fontWeight: '700', fontSize: 16 },
  empty: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing[8],
  },
}));
