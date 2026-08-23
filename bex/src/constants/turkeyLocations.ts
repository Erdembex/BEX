import data from './turkeyLocationsData.json';
import { ISTANBUL_DISTRICT_COORDS } from './istanbulDistrictCoords';

export type TurkeyCity = (typeof TURKEY_CITIES)[number];

type LocationData = {
  cities: string[];
  districtsByCity: Record<string, string[]>;
  cityCoords?: Record<string, { lat: number; lng: number }>;
};

const locationData = data as LocationData;

/** Türkiye'nin 81 ili (alfabetik) */
export const TURKEY_CITIES: readonly string[] = locationData.cities;

const districtsByCity = locationData.districtsByCity;
const cityCoords = locationData.cityCoords ?? {};

export function normalizeTurkish(text: string): string {
  return text.trim().toLocaleLowerCase('tr-TR');
}

export function getDistrictsForCity(city: string | null | undefined): string[] {
  if (!city) return [];
  const exact = districtsByCity[city];
  if (exact) return [...exact];
  const match = TURKEY_CITIES.find((c) => normalizeTurkish(c) === normalizeTurkish(city));
  return match ? [...(districtsByCity[match] ?? [])] : [];
}

export function formatLocationLabel(city?: string | null, district?: string | null): string {
  const parts = [district?.trim(), city?.trim()].filter(Boolean);
  return parts.length ? parts.join(', ') : '';
}

export function searchCities(query: string): string[] {
  const q = normalizeTurkish(query);
  if (!q) return [...TURKEY_CITIES];
  return TURKEY_CITIES.filter((city) => normalizeTurkish(city).includes(q));
}

export function searchDistricts(city: string, query: string): string[] {
  const districts = getDistrictsForCity(city);
  const q = normalizeTurkish(query);
  if (!q) return districts;
  return districts.filter((d) => normalizeTurkish(d).includes(q));
}

export function matchCity(name: string | null | undefined): string | null {
  if (!name?.trim()) return null;
  const n = normalizeTurkish(name);
  const exact = TURKEY_CITIES.find((c) => normalizeTurkish(c) === n);
  if (exact) return exact;
  return (
    TURKEY_CITIES.find(
      (c) => normalizeTurkish(c).includes(n) || n.includes(normalizeTurkish(c))
    ) ?? null
  );
}

export function matchDistrict(city: string, name: string | null | undefined): string | null {
  if (!name?.trim()) return null;
  const n = normalizeTurkish(name);
  if (normalizeTurkish(city) === n) return null;
  const districts = getDistrictsForCity(city);
  const exact = districts.find((d) => normalizeTurkish(d) === n);
  if (exact) return exact;
  return (
    districts.find((d) => normalizeTurkish(d).includes(n) || n.includes(normalizeTurkish(d))) ??
    null
  );
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** GPS koordinatından en yakın ili bulur (reverse geocode eşleşmezse) */
export function findNearestCity(lat: number, lng: number): string {
  let best = TURKEY_CITIES[0] ?? 'Ankara';
  let bestDist = Infinity;
  for (const city of TURKEY_CITIES) {
    const coords = cityCoords[city];
    if (!coords) continue;
    const d = haversineKm(lat, lng, coords.lat, coords.lng);
    if (d < bestDist) {
      bestDist = d;
      best = city;
    }
  }
  return best;
}

/** İl merkez koordinatı (harita sınırı için) */
export function getCityCenter(city: string): { lat: number; lng: number } {
  const matched = matchCity(city) ?? city;
  const coords = cityCoords[matched];
  if (coords) return coords;
  return { lat: 39.9334, lng: 32.8597 };
}

const DISTRICT_COORDS_BY_CITY: Record<string, Record<string, { lat: number; lng: number }>> = {
  İstanbul: ISTANBUL_DISTRICT_COORDS,
};

/** İlçe merkez koordinatı — bilinmiyorsa il merkezine düşer */
export function getDistrictCenter(
  city: string,
  district: string | null | undefined
): { lat: number; lng: number } | null {
  if (!district?.trim()) return null;
  const matchedCity = matchCity(city);
  if (!matchedCity) return null;
  const matchedDistrict = matchDistrict(matchedCity, district);
  if (!matchedDistrict) return null;

  const cityDistricts = DISTRICT_COORDS_BY_CITY[matchedCity];
  if (!cityDistricts) return null;

  return cityDistricts[matchedDistrict] ?? null;
}
