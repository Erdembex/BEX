import { matchCity, normalizeTurkish, getDistrictCenter } from '@/constants/turkeyLocations';
import { getCityMapBounds, type CityMapBounds } from '@/lib/cityMapRegion';

export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

export type MapRegion = MapCoordinate & {
  latitudeDelta: number;
  longitudeDelta: number;
};

export function clampMapRegion(region: MapRegion, bounds: CityMapBounds): MapRegion {
  const latitudeDelta = Math.min(Math.max(region.latitudeDelta, bounds.minZoomDelta), bounds.maxLatDelta);
  const longitudeDelta = Math.min(Math.max(region.longitudeDelta, bounds.minZoomDelta), bounds.maxLngDelta);

  const halfLat = latitudeDelta / 2;
  const halfLng = longitudeDelta / 2;

  const latitude = clamp(
    region.latitude,
    bounds.minLat + halfLat,
    bounds.maxLat - halfLat
  );
  const longitude = clamp(
    region.longitude,
    bounds.minLng + halfLng,
    bounds.maxLng - halfLng
  );

  return { latitude, longitude, latitudeDelta, longitudeDelta };
}

export function isCoordinateInsideCity(lat: number, lng: number, city: string): boolean {
  const bounds = getCityMapBounds(city);
  return lat >= bounds.minLat && lat <= bounds.maxLat && lng >= bounds.minLng && lng <= bounds.maxLng;
}

export function citiesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a?.trim() || !b?.trim()) return false;
  const left = matchCity(a);
  const right = matchCity(b);
  if (!left || !right) {
    return normalizeTurkish(a) === normalizeTurkish(b);
  }
  return left === right;
}

function clamp(value: number, min: number, max: number): number {
  if (min > max) return (min + max) / 2;
  return Math.min(Math.max(value, min), max);
}

export function buildInitialMapRegion(
  city: string,
  userLocation: MapCoordinate | null,
  userCity: string | null,
  district?: string | null
): MapRegion {
  const bounds = getCityMapBounds(city);
  const districtCenter = getDistrictCenter(city, district);

  if (districtCenter) {
    return clampMapRegion(
      {
        latitude: districtCenter.lat,
        longitude: districtCenter.lng,
        latitudeDelta: bounds.neighborhoodLatDelta * 2.2,
        longitudeDelta: bounds.neighborhoodLngDelta * 2.2,
      },
      bounds
    );
  }

  const useUser =
    userLocation != null &&
    isCoordinateInsideCity(userLocation.latitude, userLocation.longitude, city);

  if (useUser && userLocation) {
    return clampMapRegion(
      {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: bounds.neighborhoodLatDelta,
        longitudeDelta: bounds.neighborhoodLngDelta,
      },
      bounds
    );
  }

  return clampMapRegion(
    {
      latitude: bounds.center.lat,
      longitude: bounds.center.lng,
      latitudeDelta: bounds.defaultLatDelta,
      longitudeDelta: bounds.defaultLngDelta,
    },
    bounds
  );
}

const EARTH_RADIUS_KM = 6371;

export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Geocode sonucunun seçili ilçe yakınında olup olmadığını kontrol eder */
export function isCoordinateNearDistrict(
  lat: number,
  lng: number,
  city: string,
  district: string | null | undefined,
  maxKm = 18
): boolean {
  const center = getDistrictCenter(city, district);
  if (!center) return true;
  return distanceKm(lat, lng, center.lat, center.lng) <= maxKm;
}
