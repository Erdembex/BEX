import { InteractionManager, Platform } from 'react-native';
import * as Location from 'expo-location';
import {
  findNearestCity,
  matchCity,
  matchDistrict,
} from '@/constants/turkeyLocations';
import { t } from '@/i18n';

export type DeviceLocationErrorCode =
  | 'permissionRequestFailed'
  | 'permissionDenied'
  | 'servicesCheckFailed'
  | 'servicesDisabled'
  | 'timeout'
  | 'invalidCoords';

const DEVICE_LOCATION_ERROR_KEYS: Record<DeviceLocationErrorCode, string> = {
  permissionRequestFailed: 'locationPicker.errors.permissionRequestFailed',
  permissionDenied: 'locationPicker.errors.permissionDenied',
  servicesCheckFailed: 'locationPicker.errors.servicesCheckFailed',
  servicesDisabled: 'locationPicker.errors.servicesDisabled',
  timeout: 'locationPicker.errors.timeout',
  invalidCoords: 'locationPicker.errors.invalidCoords',
};

export class DeviceLocationError extends Error {
  readonly i18nKey: string;

  constructor(code: DeviceLocationErrorCode) {
    const i18nKey = DEVICE_LOCATION_ERROR_KEYS[code];
    super(t(i18nKey));
    this.name = 'DeviceLocationError';
    this.i18nKey = i18nKey;
  }
}

export function getDeviceLocationErrorMessage(err: unknown): string {
  if (err instanceof DeviceLocationError) {
    return t(err.i18nKey);
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return t('locationPicker.gpsFailed');
}

function locationError(code: DeviceLocationErrorCode): DeviceLocationError {
  return new DeviceLocationError(code);
}

export type DeviceLocationResult = {
  city: string;
  district: string | null;
  /** Koordinatlardan ilçe çözülemedi — kullanıcı listeden seçmeli (Android'de bilinçli). */
  districtManualRequired?: boolean;
};

const POSITION_TIMEOUT_MS = 25_000;
const PERMISSION_SETTLE_MS = Platform.OS === 'android' ? 650 : 200;

const positionOptions: Location.LocationOptions = {
  accuracy: Platform.OS === 'android' ? Location.Accuracy.Lowest : Location.Accuracy.Balanced,
  mayShowUserSettingsDialog: true,
};

function isValidCoords(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

async function waitForUiSettle(): Promise<void> {
  await new Promise<void>((resolve) => {
    InteractionManager.runAfterInteractions(() => resolve());
  });
  if (Platform.OS === 'android') {
    await new Promise((resolve) => setTimeout(resolve, PERMISSION_SETTLE_MS));
  }
}

async function getDevicePosition(): Promise<Location.LocationObject> {
  try {
    const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 300_000 });
    if (lastKnown && isValidCoords(lastKnown.coords.latitude, lastKnown.coords.longitude)) {
      return lastKnown;
    }
  } catch {
    // Son bilinen konum yoksa GPS ile devam et
  }

  const positionPromise = Location.getCurrentPositionAsync(positionOptions);
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(locationError('timeout')), POSITION_TIMEOUT_MS);
  });

  return Promise.race([positionPromise, timeoutPromise]);
}

async function resolveCityDistrictFromCoords(
  latitude: number,
  longitude: number
): Promise<DeviceLocationResult> {
  // Android production APK'da reverseGeocodeAsync native katmanda sorun çıkarabiliyor
  if (Platform.OS === 'android') {
    return {
      city: findNearestCity(latitude, longitude),
      district: null,
      districtManualRequired: true,
    };
  }

  let city: string | null = null;
  let district: string | null = null;

  try {
    const places = await Location.reverseGeocodeAsync({ latitude, longitude });
    const place = places[0];
    if (place) {
      city =
        matchCity(place.region) ??
        matchCity(place.city) ??
        matchCity(place.subregion) ??
        null;
      if (city) {
        district =
          matchDistrict(city, place.district) ??
          matchDistrict(city, place.subregion) ??
          matchDistrict(city, place.city) ??
          null;
      }
    }
  } catch {
    // iOS/web fallback
  }

  if (!city) {
    city = findNearestCity(latitude, longitude);
  }

  return {
    city,
    district,
    districtManualRequired: !district,
  };
}

/** İzin + servis kontrolü; koordinat döner veya null (harita vb.) */
export async function getDeviceCoordinates(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const enabled = await Location.hasServicesEnabledAsync();
    if (!enabled) return null;

    await waitForUiSettle();

    const position = await getDevicePosition();
    const { latitude, longitude } = position.coords;
    if (!isValidCoords(latitude, longitude)) return null;
    return { latitude, longitude };
  } catch {
    return null;
  }
}

/** Konum izni alır, GPS + reverse geocode ile il/ilçe çözer */
export async function resolveLocationFromDevice(): Promise<DeviceLocationResult> {
  let status: Location.PermissionStatus;
  try {
    ({ status } = await Location.requestForegroundPermissionsAsync());
  } catch {
    throw locationError('permissionRequestFailed');
  }

  if (status !== 'granted') {
    throw locationError('permissionDenied');
  }

  let enabled = false;
  try {
    enabled = await Location.hasServicesEnabledAsync();
  } catch {
    throw locationError('servicesCheckFailed');
  }

  if (!enabled) {
    throw locationError('servicesDisabled');
  }

  await waitForUiSettle();

  let position: Location.LocationObject;
  try {
    position = await getDevicePosition();
  } catch (err: unknown) {
    if (err instanceof DeviceLocationError) throw err;
    throw locationError('timeout');
  }

  const { latitude, longitude } = position.coords;
  if (!isValidCoords(latitude, longitude)) {
    throw locationError('invalidCoords');
  }

  return resolveCityDistrictFromCoords(latitude, longitude);
}

export async function hasForegroundLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}
