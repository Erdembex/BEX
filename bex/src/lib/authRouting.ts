import { UserRole } from '../types';
import { Href } from 'expo-router';

/** Kök index üzerinden role göre yönlendirme (en güvenilir yol) */
export const AUTH_HOME_ROUTE = '/' as Href;

export function getHomeRouteForRole(role: UserRole): Href {
  return AUTH_HOME_ROUTE;
}

export function isBusinessRole(role: UserRole | undefined): boolean {
  return role === 'business';
}

/** Login sonrası güvenli geri dönüş rotası — harici ve auth ekranlarını reddeder. */
export function resolvePostLoginRoute(
  returnTo: string | string[] | undefined,
  fallback: Href = AUTH_HOME_ROUTE
): Href {
  const raw = Array.isArray(returnTo) ? returnTo[0] : returnTo;
  const path = raw?.trim();
  if (!path || !path.startsWith('/')) return fallback;
  if (path.startsWith('/(auth)')) return fallback;
  return path as Href;
}
