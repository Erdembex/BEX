import * as Location from 'expo-location';
import { getCityCenter } from '@/constants/turkeyLocations';

export type GeocodedPoint = {
  latitude: number;
  longitude: number;
};

const cache = new Map<string, GeocodedPoint>();

function cacheKey(query: string): string {
  return query.trim().toLocaleLowerCase('tr-TR');
}

/** Deterministic küçük sapma — geocode başarısız olursa il içinde pin dağıtır */
function fallbackCoords(seed: string, city: string): GeocodedPoint {
  const center = getCityCenter(city);
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const angle = ((hash % 360) * Math.PI) / 180;
  const radius = 0.012 + (hash % 1000) / 100000;
  return {
    latitude: center.lat + Math.sin(angle) * radius,
    longitude: center.lng + Math.cos(angle) * radius,
  };
}

export async function geocodeAddressQuery(query: string, city: string): Promise<GeocodedPoint> {
  const normalized = cacheKey(query);
  const cached = cache.get(normalized);
  if (cached) return cached;

  const trimmed = query.trim();
  if (!trimmed) {
    const point = fallbackCoords(city, city);
    cache.set(normalized, point);
    return point;
  }

  try {
    const results = await Location.geocodeAsync(`${trimmed}, Türkiye`);
    const hit = results.find(
      (item) =>
        typeof item.latitude === 'number' &&
        typeof item.longitude === 'number' &&
        Number.isFinite(item.latitude) &&
        Number.isFinite(item.longitude)
    );
    if (hit) {
      const point = { latitude: hit.latitude, longitude: hit.longitude };
      cache.set(normalized, point);
      return point;
    }
  } catch {
    // emülatör / web — fallback
  }

  const point = fallbackCoords(trimmed, city);
  cache.set(normalized, point);
  return point;
}

export function buildBusinessGeocodeQuery(
  openAddress: string,
  district: string | null | undefined,
  city: string
): string {
  const parts = [openAddress?.trim(), district?.trim(), city.trim()].filter(Boolean);
  return parts.join(', ');
}
