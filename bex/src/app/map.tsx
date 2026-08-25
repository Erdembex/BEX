import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Screen } from '@/components/common/Screen';
import { LocationFilter } from '@/components/common/LocationPicker';
import { DiscoverMapView } from '@/components/map/DiscoverMapView';
import { useAuthStore } from '@/store/authStore';
import { resolveLocationFilter } from '@/lib/resolveLocationFilter';
import { saveLocationFilter } from '@/lib/locationFilterStorage';
import { formatFilterLocationLabel, isLocationAll } from '@/lib/locationFilterUtils';
import { buildInitialMapRegion, type MapCoordinate, type MapRegion } from '@/lib/mapRegionUtils';
import { loadMapBusinessPins } from '@/features/map/mapBusinessService';
import type { MapBusinessPin } from '@/components/map/types';
import { Typography, Spacing, createThemedStyles, useThemeColors, Radius } from '@/theme';
import { BRAND_NAVY } from '@/theme/brand';
import { useTranslation } from '@/i18n';

export default function MapScreen() {
  const Colors = useThemeColors();
  const styles = useStyles();
  const { t } = useTranslation();
  const { pickFor } = useLocalSearchParams<{ pickFor?: string }>();
  const pickingForTasks = pickFor === 'tasks';
  const { bexUser, isInitialized } = useAuthStore();

  const [city, setCity] = useState<string | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [filterReady, setFilterReady] = useState(false);
  const [mapRegion, setMapRegion] = useState<MapRegion | null>(null);
  const [pins, setPins] = useState<MapBusinessPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchUserGeo = useCallback(async (selectedCity: string) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return { location: null as MapCoordinate | null, city: null as string | null };
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      let resolvedCity: string | null = selectedCity;
      try {
        const places = await Location.reverseGeocodeAsync(location);
        const place = places[0];
        resolvedCity = place?.city ?? place?.region ?? place?.subregion ?? selectedCity;
      } catch {
        resolvedCity = selectedCity;
      }

      return { location, city: resolvedCity };
    } catch {
      return { location: null as MapCoordinate | null, city: null as string | null };
    }
  }, []);

  const loadPins = useCallback(async () => {
    if (!city?.trim()) {
      setPins([]);
      setMapRegion(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    const geo = await fetchUserGeo(city);
    setMapRegion(buildInitialMapRegion(city, geo.location, geo.city ?? city, district));

    try {
      const loaded = await loadMapBusinessPins(city, district);
      setPins(loaded);
    } catch (err) {
      setPins([]);
      setLoadError(err instanceof Error ? err.message : t('map.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [city, district, fetchUserGeo, t]);

  useEffect(() => {
    if (!isInitialized) return;
    let cancelled = false;

    (async () => {
      const resolved = await resolveLocationFilter(bexUser);
      if (cancelled) return;
      setCity(resolved.city);
      setDistrict(resolved.district);
      setFilterReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [isInitialized, bexUser?.city, bexUser?.district]);

  useEffect(() => {
    if (!filterReady) return;
    saveLocationFilter({ city, district });
  }, [city, district, filterReady]);

  useFocusEffect(
    useCallback(() => {
      if (!filterReady) return;
      loadPins();
    }, [filterReady, loadPins])
  );

  const applyPickedLocation = useCallback(async () => {
    await saveLocationFilter({ city, district });
    router.replace('/(tabs)/tasks' as import('expo-router').Href);
  }, [city, district]);

  const matchedCity = city?.trim() ?? '';
  const locationLabel = formatFilterLocationLabel(city, district);
  const focusDistrict =
    district?.trim() && !isLocationAll(district) ? district : null;

  return (
    <Screen style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t('map.title')}</Text>
          {matchedCity ? (
            <Text style={styles.subtitle}>{t('map.cityScope', { city: locationLabel })}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.filters}>
        <LocationFilter
          city={city}
          district={district}
          onCityChange={setCity}
          onDistrictChange={setDistrict}
        />
        {loadError ? <Text style={styles.error}>{loadError}</Text> : null}
        {matchedCity ? (
          <Text style={styles.hint}>{t('map.panHint')}</Text>
        ) : (
          <Text style={styles.hint}>{t('map.selectCityHint')}</Text>
        )}
      </View>

      <View style={styles.mapArea}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : !matchedCity ? (
          <View style={styles.center}>
            <Text style={styles.empty}>{t('map.selectCityHint')}</Text>
          </View>
        ) : mapRegion ? (
          <DiscoverMapView
            key={`${matchedCity}-${focusDistrict ?? 'all'}`}
            city={matchedCity}
            focusDistrict={focusDistrict}
            initialRegion={mapRegion}
            pins={pins}
          />
        ) : (
          <View style={styles.center}>
            <Text style={styles.empty}>{t('map.selectCityHint')}</Text>
          </View>
        )}
      </View>

      {matchedCity && !loading ? (
        <View style={styles.footer}>
          {pickingForTasks ? (
            <TouchableOpacity style={styles.applyBtn} onPress={applyPickedLocation} activeOpacity={0.88}>
              <Text style={styles.applyBtnText}>{t('locationPicker.applyLocationToTasks')}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.footerText}>{t('map.listings', { count: pins.length })}</Text>
          )}
        </View>
      ) : null}
    </Screen>
  );
}

const useStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[2],
    paddingBottom: Spacing[2],
  },
  backBtn: { paddingVertical: Spacing[1] },
  backText: { ...Typography.labelMedium, color: Colors.primary, fontWeight: '700' },
  headerText: { flex: 1, gap: 2 },
  title: { ...Typography.headingSmall, color: Colors.textPrimary, fontWeight: '800' },
  subtitle: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  filters: {
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[3],
    gap: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGold,
  },
  hint: { ...Typography.caption, color: Colors.textMuted, lineHeight: 18 },
  mapArea: { flex: 1, minHeight: 360 },
  error: { ...Typography.caption, color: Colors.error, marginTop: Spacing[1] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing[5] },
  empty: { ...Typography.bodyMedium, color: Colors.textSecondary, textAlign: 'center' },
  footer: {
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: Colors.borderGold,
    backgroundColor: Colors.surface,
  },
  footerText: {
    ...Typography.labelMedium,
    color: BRAND_NAVY,
    fontWeight: '700',
    textAlign: 'center',
  },
  applyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing[3],
    alignItems: 'center',
  },
  applyBtnText: {
    ...Typography.labelMedium,
    color: Colors.textOnPrimary,
    fontWeight: '700',
  },
}));
