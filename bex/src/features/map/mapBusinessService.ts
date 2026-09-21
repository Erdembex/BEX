import { shouldUseDemoData } from '@/lib/devMode';
import { demoStore } from '@/lib/demoStore';
import { matchCity, matchDistrict, normalizeTurkish } from '@/constants/turkeyLocations';
import {
  buildBusinessGeocodeQuery,
  fallbackCoordsAt,
  geocodeAddressQuery,
} from '@/lib/geocodeAddress';
import { discoverListings } from '@/features/listing/listingsApi';
import type { EnrichedTask } from '@/features/data/businessesRepository';
import { fetchPublicBusinessProfile } from '@/features/business/businessProfileApi';
import { isLocationAll, toApiCityFilter } from '@/lib/locationFilterUtils';
import { isCoordinateNearDistrict } from '@/lib/mapRegionUtils';
import type { MapBusinessPin } from '@/components/map/types';

const GEOCODE_BATCH = 4;
const MAP_LISTING_PAGE_SIZE = 50;
const MAP_LISTING_MAX_PAGES = 4;

type PendingPin = {
  listingId: string;
  businessId: string;
  name: string;
  address: string;
  verified: boolean;
  district: string | null;
  geocodeQuery: string;
  serverLatitude?: number | null;
  serverLongitude?: number | null;
};

function hasServerCoords(item: PendingPin): boolean {
  return item.serverLatitude != null && item.serverLongitude != null;
}

async function mapInBatches<T, R>(
  items: T[],
  mapper: (item: T) => Promise<R | null>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += GEOCODE_BATCH) {
    const chunk = items.slice(i, i + GEOCODE_BATCH);
    const mapped = await Promise.all(chunk.map(mapper));
    for (const item of mapped) {
      if (item != null) results.push(item);
    }
  }
  return results;
}

function parseDistrictFromAddress(address: string, city: string): string | null {
  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) return null;
  const cityPart = parts[parts.length - 1];
  if (normalizeTurkish(cityPart) !== normalizeTurkish(city)) return null;
  return parts[parts.length - 2] ?? null;
}

function listingMatchesDistrict(
  city: string,
  selectedDistrict: string,
  hints: {
    district?: string | null;
    address?: string | null;
    locationLabel?: string | null;
  }
): boolean {
  const target = matchDistrict(city, selectedDistrict);
  if (!target) return true;

  const candidates = [
    hints.district,
    hints.locationLabel?.split(',')[0]?.trim(),
    parseDistrictFromAddress(hints.address ?? '', city),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (matchDistrict(city, candidate) === target) return true;
    if (normalizeTurkish(candidate) === normalizeTurkish(target)) return true;
  }

  const addressNorm = normalizeTurkish(hints.address ?? '');
  return addressNorm.includes(normalizeTurkish(target));
}

async function fetchCityListings(city: string): Promise<EnrichedTask[]> {
  const matchedCity = matchCity(city) ?? city;
  const apiCity = toApiCityFilter(matchedCity);
  const tasks: EnrichedTask[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < MAP_LISTING_MAX_PAGES; page += 1) {
    const result = await discoverListings({
      pageSize: MAP_LISTING_PAGE_SIZE,
      cursor,
      city: apiCity,
    });
    tasks.push(...result.tasks);
    if (!result.nextCursor || result.tasks.length === 0) break;
    cursor = result.nextCursor;
  }

  return tasks.filter((task) => task.status === 'active');
}

function upsertPendingPin(map: Map<string, PendingPin>, next: PendingPin): void {
  const existing = map.get(next.businessId);
  if (!existing) {
    map.set(next.businessId, next);
    return;
  }
  if (!hasServerCoords(existing) && hasServerCoords(next)) {
    map.set(next.businessId, next);
  }
}

function uniqueBusinessesFromDemo(city: string, district: string | null): PendingPin[] {
  const matchedCity = matchCity(city) ?? city;
  const businesses = demoStore.getBusinesses().filter((biz) => {
    const parts = biz.address.split(',').map((p) => p.trim());
    const bizCity = parts[parts.length - 1] ?? '';
    if (normalizeTurkish(bizCity) !== normalizeTurkish(matchedCity)) return false;
    if (!district?.trim() || isLocationAll(district)) return true;
    const bizDistrict = parts.length >= 2 ? parts[parts.length - 2] : '';
    return !bizDistrict || normalizeTurkish(bizDistrict) === normalizeTurkish(district);
  });

  const byBusiness = new Map<string, PendingPin>();

  for (const biz of businesses) {
    const bizTasks = demoStore.getVisibleTasks().filter((task) => task.businessId === biz.id);
    if (bizTasks.length === 0) {
      upsertPendingPin(byBusiness, {
        listingId: biz.id,
        businessId: biz.id,
        name: biz.name,
        address: biz.address,
        verified: biz.isVerified,
        district: null,
        geocodeQuery: biz.address,
      });
      continue;
    }
    for (const task of bizTasks) {
      upsertPendingPin(byBusiness, {
        listingId: task.id,
        businessId: biz.id,
        name: task.title?.trim() || biz.name,
        address: biz.address,
        verified: biz.isVerified,
        district: null,
        geocodeQuery: biz.address,
      });
    }
  }

  return [...byBusiness.values()];
}

function pinFromServerCoords(
  item: PendingPin,
  city: string,
  filterDistrict: string | null
): MapBusinessPin | null {
  if (!hasServerCoords(item)) return null;

  const metaMatch = filterDistrict
    ? listingMatchesDistrict(city, filterDistrict, {
        district: item.district,
        address: item.address,
        locationLabel: item.district ? `${item.district}, ${city}` : null,
      })
    : true;

  const point = {
    latitude: item.serverLatitude as number,
    longitude: item.serverLongitude as number,
  };

  if (
    filterDistrict &&
    !metaMatch &&
    !isCoordinateNearDistrict(point.latitude, point.longitude, city, filterDistrict)
  ) {
    return null;
  }

  return buildPin(item, point);
}

async function geocodeListingPin(
  item: PendingPin,
  city: string,
  filterDistrict: string | null
): Promise<MapBusinessPin | null> {
  const fromServer = pinFromServerCoords(item, city, filterDistrict);
  if (fromServer) return fromServer;

  const metaMatch = filterDistrict
    ? listingMatchesDistrict(city, filterDistrict, {
        district: item.district,
        address: item.address,
        locationLabel: item.district ? `${item.district}, ${city}` : null,
      })
    : true;

  const geocoded = await geocodeAddressQuery(
    item.geocodeQuery || item.address,
    city,
    filterDistrict,
    { allowFallback: false }
  );

  let point = geocoded;
  if (filterDistrict) {
    const nearDistrict =
      point != null &&
      isCoordinateNearDistrict(point.latitude, point.longitude, city, filterDistrict);

    if (nearDistrict) {
      // geocode ilçe sınırları içinde
    } else if (metaMatch) {
      point = fallbackCoordsAt(item.listingId, city, filterDistrict);
    } else {
      return null;
    }
  }

  if (!point) {
    if (!filterDistrict) {
      point =
        (await geocodeAddressQuery(item.geocodeQuery || item.address, city, null)) ??
        fallbackCoordsAt(item.listingId, city, null);
    } else {
      return null;
    }
  }

  return buildPin(item, point);
}

function buildPin(
  item: PendingPin,
  point: { latitude: number; longitude: number }
): MapBusinessPin {
  return {
    id: item.businessId,
    listingId: item.listingId,
    businessId: item.businessId,
    name: item.name,
    address: item.address,
    verified: item.verified,
    district: item.district,
    latitude: point.latitude,
    longitude: point.longitude,
  };
}

async function enrichPendingFromProfile(item: PendingPin, city: string): Promise<PendingPin> {
  if (hasServerCoords(item)) return item;

  try {
    const profile = await fetchPublicBusinessProfile(item.businessId);
    if (!profile) return item;

    const profileDistrict =
      parseDistrictFromAddress(profile.address, city) ?? item.district ?? null;
    const lat = profile.location?.latitude;
    const lng = profile.location?.longitude;
    const hasProfileCoords =
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      !(lat === 41.0082 && lng === 28.9784);

    return {
      ...item,
      address: profile.address || item.address,
      verified: profile.isVerified ?? item.verified,
      district: profileDistrict,
      geocodeQuery:
        profile.address ||
        buildBusinessGeocodeQuery('', profileDistrict, city) ||
        item.geocodeQuery,
      serverLatitude: hasProfileCoords ? lat : item.serverLatitude,
      serverLongitude: hasProfileCoords ? lng : item.serverLongitude,
    };
  } catch {
    return item;
  }
}

export async function loadMapBusinessPins(
  city: string,
  district: string | null
): Promise<MapBusinessPin[]> {
  const matchedCity = matchCity(city) ?? city;
  const filterDistrict =
    district?.trim() && !isLocationAll(district)
      ? matchDistrict(matchedCity, district) ?? district
      : null;

  if (shouldUseDemoData()) {
    const pending = uniqueBusinessesFromDemo(matchedCity, filterDistrict);
    return mapInBatches(pending, (item) => geocodeListingPin(item, matchedCity, filterDistrict));
  }

  const tasks = await fetchCityListings(matchedCity);
  const byBusiness = new Map<string, PendingPin>();

  for (const task of tasks) {
    const businessId = task.businessId;
    if (!businessId || task.status !== 'active') continue;

    const profileDistrict = task.locationLabel?.split(',')[0]?.trim() ?? null;
    const address = task.locationLabel?.trim() || matchedCity;

    upsertPendingPin(byBusiness, {
      listingId: task.id,
      businessId,
      name: task.title?.trim() || task.businessName?.trim() || 'İlan',
      address,
      verified: task.businessVerified ?? false,
      district: profileDistrict,
      geocodeQuery:
        buildBusinessGeocodeQuery('', profileDistrict, matchedCity) || address,
      serverLatitude: task.businessLatitude ?? null,
      serverLongitude: task.businessLongitude ?? null,
    });
  }

  if (byBusiness.size === 0) {
    return [];
  }

  let pending = [...byBusiness.values()];

  const withCoords: MapBusinessPin[] = [];
  const needsProfile: PendingPin[] = [];
  const needsGeocode: PendingPin[] = [];

  for (const item of pending) {
    const pin = pinFromServerCoords(item, matchedCity, filterDistrict);
    if (pin) {
      withCoords.push(pin);
      continue;
    }
    if (hasServerCoords(item)) {
      continue;
    }
    needsProfile.push(item);
  }

  if (needsProfile.length > 0) {
    pending = await mapInBatches(needsProfile, (item) => enrichPendingFromProfile(item, matchedCity));
    for (const item of pending) {
      const pin = pinFromServerCoords(item, matchedCity, filterDistrict);
      if (pin) {
        withCoords.push(pin);
      } else if (!hasServerCoords(item)) {
        needsGeocode.push(item);
      }
    }
  }

  const geocoded = await mapInBatches(needsGeocode, (item) =>
    geocodeListingPin(item, matchedCity, filterDistrict)
  );

  return [...withCoords, ...geocoded];
}
