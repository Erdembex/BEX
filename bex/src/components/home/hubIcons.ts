import { ImageSourcePropType } from 'react-native';

export type HubIconKey =
  | 'tasks'
  | 'trade'
  | 'wallet'
  | 'messages'
  | 'applications'
  | 'profile'
  | 'settings';

export const HUB_ICONS: Record<HubIconKey, ImageSourcePropType> = {
  tasks: require('../../../assets/icons/hub/hub-tasks.png'),
  trade: require('../../../assets/icons/hub/hub-trade.png'),
  wallet: require('../../../assets/icons/hub/hub-wallet.png'),
  messages: require('../../../assets/icons/hub/hub-messages.png'),
  applications: require('../../../assets/icons/hub/hub-applications.png'),
  profile: require('../../../assets/icons/hub/hub-profile.png'),
  settings: require('../../../assets/icons/hub/hub-settings.png'),
};
