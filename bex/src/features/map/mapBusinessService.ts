import { shouldUseDemoData } from '@/lib/devMode';
import { demoStore } from '@/lib/demoStore';
import { matchCity, normalizeTurkish } from '@/constants/turkeyLocations';
import {
  buildBusinessGeocodeQuery,
  geocodeAddressQuery,
} from '@/lib/geocodeAddress';
import { tasksRepository } from '@/features/data/businessesRepository';
import { fetchPublicBusinessProfile } from '@/features/business/businessProfileApi';
import { isLocationAll } from '@/lib/locationFilterUtils';
import type { MapBusinessPin } from '@/components/map/types';

const GEOCODE_BATCH = 5;

type PendingPin = {
  id: string;
  name: string;
  address: string;
  verified: boolean;
  district: string | null;
  geocodeQuery: string;
};

async function mapInBatches<T, R>(items: T[], mapper: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += GEOCODE_BATCH) {
    const chunk = items.slice(i, i + GEOCODE_BATCH);
    const mapped = await Promise.all(chunk.map(mapper));
    results.push(...mapped);
  }
  return results;
}

async function geocodePending(item: PendingPin, city: string): Promise<MapBusinessPin> {
  const point = await geocodeAddressQuery(item.geocodeQuery || item.address, city);
  return {
    id: item.id,
    name: item.name,
    address: item.address,
    verified: item.verified,
    district: item.district,
    latitude: point.latitude,
    longitude: point.longitude,
  };
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

  return businesses.map((biz) => ({
    id: biz.id,
    name: biz.name,
    address: biz.address,
    verified: biz.isVerified,
    district: null,
    geocodeQuery: biz.address,
  }));
}

export async function loadMapBusinessPins(
  city: string,
  district: string | null
): Promise<MapBusinessPin[]> {
  const matchedCity = matchCity(city) ?? city;
  const apiDistrict = !district?.trim() || isLocationAll(district) ? null : district;

  if (shouldUseDemoData()) {
    const pending = uniqueBusinessesFromDemo(matchedCity, district);
    return mapInBatches(pending, (item) => geocodePending(item, matchedCity));
  }

  const { tasks } = await tasksRepository.getActive(60, null, {
    city: matchedCity,
    district: apiDistrict ?? undefined,
  });

  const byBusiness = new Map<string, PendingPin>();

  for (const task of tasks) {
    const businessId = task.businessId;
    if (!businessId || byBusiness.has(businessId)) continue;

    byBusiness.set(businessId, {
      id: businessId,
      name: task.businessName?.trim() || 'İşletme',
      address: task.locationLabel?.trim() || matchedCity,
      verified: task.businessVerified ?? false,
      district: task.locationLabel?.split(',')[0]?.trim() ?? null,
      geocodeQuery: '',
    });
  }

  const enriched = await Promise.all(
    [...byBusiness.values()].map(async (entry) => {
      try {
        const profile = await fetchPublicBusinessProfile(entry.id);
        if (!profile) return entry;
        return {
          ...entry,
          name: profile.name || entry.name,
          address: profile.address || entry.address,
          verified: profile.isVerified,
          geocodeQuery: profile.address || buildBusinessGeocodeQuery('', entry.district, matchedCity),
        };
      } catch {
        return {
          ...entry,
          geocodeQuery: [entry.address, matchedCity].filter(Boolean).join(', '),
        };
      }
    })
  );

  if (enriched.length === 0) {
    return [];
  }

  return mapInBatches(enriched, (item) => geocodePending(item, matchedCity));
}
