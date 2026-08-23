import * as Location from 'expo-location';
import { getCityCenter, getDistrictCenter } from '@/constants/turkeyLocations';
import {
  isCoordinateInsideCity,
  isCoordinateNearDistrict,
  type MapCoordinate,
} from '@/lib/mapRegionUtils';

export type GeocodedPoint = {
  latitude: number;
  longitude: number;
};

const cache = new Map<string, GeocodedPoint>();

function cacheKey(query: string): string {
  return query.trim().toLocaleLowerCase('tr-TR');
}

/** Deterministic küçük sapma — geocode başarısız olursa il/ilçe içinde pin dağıtır */
function fallbackCoords(seed: string, city: string, district?: string | null): GeocodedPoint {
  return fallbackCoordsAt(seed, city, district);
}

export function fallbackCoordsAt(
  seed: string,
  city: string,
  district?: string | null
): GeocodedPoint {
  const districtCenter = getDistrictCenter(city, district);
  const center = districtCenter ?? getCityCenter(city);
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const angle = ((hash % 360) * Math.PI) / 180;
  const radius = 0.004 + (hash % 1000) / 200000;
  return {
    latitude: center.lat + Math.sin(angle) * radius,
    longitude: center.lng + Math.cos(angle) * radius,
  };
}

function isValidGeocodeResult(
  point: MapCoordinate,
  city: string,
  district?: string | null
): boolean {
  if (!isCoordinateInsideCity(point.latitude, point.longitude, city)) {
    return false;
  }
  if (district?.trim()) {
    return isCoordinateNearDistrict(point.latitude, point.longitude, city, district);
  }
  return true;
}

export async function geocodeAddressQuery(
  query: string,
  city: string,
  district?: string | null,
  options?: { allowFallback?: boolean }
): Promise<GeocodedPoint | null> {
  const allowFallback = options?.allowFallback ?? true;
  const cacheSuffix = district?.trim() ? `|${district.trim().toLocaleLowerCase('tr-TR')}` : '';
  const strictSuffix = allowFallback ? '' : '|strict';
  const normalized = `${cacheKey(query)}${cacheSuffix}${strictSuffix}`;
  const cached = cache.get(normalized);
  if (cached) return cached;

  const trimmed = query.trim();
  if (!trimmed) {
    if (!allowFallback) return null;
    const point = fallbackCoords(city, city, district);
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
        Number.isFinite(item.longitude) &&
        isValidGeocodeResult(
          { latitude: item.latitude, longitude: item.longitude },
          city,
          district
        )
    );
    if (hit) {
      const point = { latitude: hit.latitude, longitude: hit.longitude };
      cache.set(normalized, point);
      return point;
    }
  } catch {
    // emülatör / web — fallback
  }

  if (!allowFallback) return null;

  const point = fallbackCoords(trimmed, city, district);
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
