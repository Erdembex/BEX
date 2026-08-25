import { router } from 'expo-router';

/** Bireysel kullanıcı ana hub ekranına dön. */
export function goUserHub() {
  router.replace('/(tabs)/home');
}

/** Alt ekranlarda sol üst geri ok — hub'a döner. */
export function userHubBackHeaderProps() {
  return {
    onBack: goUserHub,
    showMenu: false,
  } as const;
}
