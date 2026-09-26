import { Platform, ViewStyle } from 'react-native';

/** Android release: flex satırında metin dikey harf harf kırılmasın */
export const flexRowTextHost: ViewStyle = {
  flex: 1,
  flexBasis: 0,
  minWidth: 0,
  maxWidth: '100%',
  ...(Platform.OS === 'android' ? { flexGrow: 1, flexShrink: 1 } : {}),
};

export const flexRowItem: ViewStyle = {
  flexShrink: 0,
};
