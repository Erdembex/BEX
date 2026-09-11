import { matchCity, matchDistrict, formatLocationLabel } from '@/constants/turkeyLocations';
import { t } from '@/i18n';

/** Konum filtresinde “tümü” seçeneği — depolama anahtarı */
export const LOCATION_ALL = 'Hepsi';

export function isLocationAll(value: string | null | undefined): boolean {
  return value === LOCATION_ALL;
}

export function getLocationAllLabel(): string {
  return t('locationPicker.allOption');
}

export function toApiCityFilter(city: string | null | undefined): string | undefined {
  if (!city || isLocationAll(city)) return undefined;
  return matchCity(city) ?? (city.trim() || undefined);
}

export function toApiDistrictFilter(
  city: string | null | undefined,
  district: string | null | undefined
): string | undefined {
  if (!district || isLocationAll(district) || isLocationAll(city)) return undefined;
  const matchedCity = matchCity(city);
  if (matchedCity) {
    return matchDistrict(matchedCity, district) ?? (district.trim() || undefined);
  }
  const trimmed = district.trim();
  return trimmed || undefined;
}

export function formatFilterLocationLabel(
  city: string | null | undefined,
  district: string | null | undefined
): string {
  if (isLocationAll(city) || (!city && !district)) {
    return t('locationPicker.allTurkey');
  }
  if (city && (isLocationAll(district) || !district)) {
    return t('locationPicker.allDistrictsInCity', { city });
  }
  return formatLocationLabel(city, district);
}

export function hasActiveLocationFilter(
  city: string | null | undefined,
  district: string | null | undefined
): boolean {
  return !!(toApiCityFilter(city) || toApiDistrictFilter(city, district));
}

/** Liste/modal gösterimi — depolama değerini yerelleştirir */
export function formatLocationOptionLabel(value: string): string {
  return isLocationAll(value) ? getLocationAllLabel() : value;
}
