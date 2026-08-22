import { getCityCenter } from '@/constants/turkeyLocations';

/** Büyükşehirler — harita sınırı daha geniş */
const METRO_CITIES = new Set([
  'İstanbul',
  'Ankara',
  'İzmir',
  'Bursa',
  'Antalya',
  'Kocaeli',
  'Adana',
  'Gaziantep',
  'Konya',
  'Mersin',
]);

export type CityMapBounds = {
  center: { lat: number; lng: number };
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  defaultLatDelta: number;
  defaultLngDelta: number;
  neighborhoodLatDelta: number;
  neighborhoodLngDelta: number;
  minZoomDelta: number;
  maxLatDelta: number;
  maxLngDelta: number;
};

export function getCityMapBounds(city: string): CityMapBounds {
  const center = getCityCenter(city);
  const metro = METRO_CITIES.has(city);

  const latSpan = metro ? 0.52 : 0.34;
  const lngSpan = metro ? (city === 'İstanbul' ? 0.92 : 0.72) : 0.42;

  const maxLatDelta = latSpan;
  const maxLngDelta = lngSpan;

  return {
    center,
    minLat: center.lat - latSpan / 2,
    maxLat: center.lat + latSpan / 2,
    minLng: center.lng - lngSpan / 2,
    maxLng: center.lng + lngSpan / 2,
    defaultLatDelta: metro ? 0.22 : 0.16,
    defaultLngDelta: metro ? 0.22 : 0.16,
    neighborhoodLatDelta: 0.045,
    neighborhoodLngDelta: 0.045,
    minZoomDelta: 0.018,
    maxLatDelta,
    maxLngDelta,
  };
}
