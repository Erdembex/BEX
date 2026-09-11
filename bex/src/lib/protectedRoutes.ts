/**
 * Oturum gerektiren rota kuralları.
 * Deep link ile (auth) dışındaki korumalı ekranlara erişim engellenir.
 */

const PROTECTED_ROOTS = new Set([
  'settings',
  'map',
  'delete-account',
  'blocked-users',
  'leaderboard',
  'search',
  'notifications',
  'application',
  'complaint',
  'swap-chat',
]);

const PUBLIC_ROOTS = new Set(['about', 'setup-guide', 'expo-test-guide']);

/** Her zaman oturum gerektiren grup layout'ları */
const PROTECTED_GROUPS = new Set(['(tabs)', '(business)', '(admin)']);

export function isAuthRequiredPath(pathname: string, segments: readonly string[]): boolean {
  const root = segments[0];
  if (!root) {
    return pathname !== '/' && pathname !== '';
  }

  if (root === '(auth)') return false;
  if (PUBLIC_ROOTS.has(root)) return false;

  // Genel işletme / kullanıcı profilleri (keşif)
  if (root === 'business' && segments.length >= 2) return false;
  if (root === 'user') return false;

  if (PROTECTED_GROUPS.has(root)) return true;
  if (PROTECTED_ROOTS.has(root)) return true;

  // Başvuru / teslim ekranları oturum gerektirir; görev detayı paylaşılabilir kalır
  if (root === 'task') {
    const action = segments[1];
    return action === 'apply' || action === 'submit';
  }

  return false;
}

export function buildLoginRedirect(returnTo: string) {
  return {
    pathname: '/(auth)/login' as const,
    params: { returnTo },
  };
}
