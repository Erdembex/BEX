import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { router, Href } from 'expo-router';
import { getCityMapBounds } from '@/lib/cityMapRegion';
import { clampMapRegion, type MapRegion } from '@/lib/mapRegionUtils';
import { Typography, Radius, Spacing, useThemeColors } from '@/theme';
import { BRAND_NAVY } from '@/theme/brand';
import { useTranslation } from '@/i18n';
import { getGoogleMapsApiKey, isAndroidMapsKeyConfigured } from '@/lib/googleMapsConfig';
import type { MapBusinessPin } from './types';

type Props = {
  city: string;
  focusDistrict?: string | null;
  initialRegion: MapRegion;
  pins: MapBusinessPin[];
  locationGranted?: boolean;
};

export function DiscoverMapView({
  city,
  focusDistrict,
  initialRegion,
  pins,
  locationGranted = false,
}: Props) {
  const Colors = useThemeColors();
  const { t } = useTranslation();
  const mapRef = useRef<MapView>(null);
  const bounds = useMemo(() => getCityMapBounds(city), [city]);
  const lockDistrictView = Boolean(focusDistrict?.trim());

  const showUserLocation = locationGranted;

  useEffect(() => {
    if (!mapRef.current) return;

    if (lockDistrictView) {
      if (pins.length > 0) {
        const coords = pins.map((pin) => ({
          latitude: pin.latitude,
          longitude: pin.longitude,
        }));
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 72, right: 48, bottom: 120, left: 48 },
          animated: true,
        });
      } else {
        mapRef.current.animateToRegion(initialRegion, 400);
      }
      return;
    }

    if (pins.length === 0) return;

    const coords = pins.map((pin) => ({
      latitude: pin.latitude,
      longitude: pin.longitude,
    }));

    if (coords.length === 1) {
      mapRef.current.animateToRegion(
        {
          ...coords[0],
          latitudeDelta: bounds.neighborhoodLatDelta * 2,
          longitudeDelta: bounds.neighborhoodLngDelta * 2,
        },
        400
      );
      return;
    }

    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 72, right: 48, bottom: 120, left: 48 },
      animated: true,
    });
  }, [pins, bounds.neighborhoodLatDelta, bounds.neighborhoodLngDelta, lockDistrictView, initialRegion]);

  const onRegionChangeComplete = useCallback(
    (next: Region) => {
      const clamped = clampMapRegion(next, bounds);
      const latDiff = Math.abs(clamped.latitude - next.latitude);
      const lngDiff = Math.abs(clamped.longitude - next.longitude);
      const zoomDiff =
        Math.abs(clamped.latitudeDelta - next.latitudeDelta) +
        Math.abs(clamped.longitudeDelta - next.longitudeDelta);

      if (latDiff > 0.002 || lngDiff > 0.002 || zoomDiff > 0.05) {
        mapRef.current?.animateToRegion(clamped, 220);
      }
    },
    [bounds]
  );

  const googleMapsKey = getGoogleMapsApiKey();
  const mapProvider =
    Platform.OS === 'android' && googleMapsKey ? PROVIDER_GOOGLE : undefined;
  const showTilesWarning = Platform.OS === 'android' && !isAndroidMapsKeyConfigured();

  return (
    <View style={styles.wrap}>
      {showTilesWarning ? (
        <View style={[styles.tilesBanner, { backgroundColor: Colors.card, borderColor: Colors.border }]}>
          <Text style={[styles.tilesBannerText, { color: Colors.textPrimary }]}>
            {t('map.tilesMissing')}
          </Text>
        </View>
      ) : null}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={mapProvider}
        initialRegion={initialRegion}
        onRegionChangeComplete={onRegionChangeComplete}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={showUserLocation}
        showsCompass
        showsScale
        rotateEnabled={false}
        loadingEnabled
        mapType="standard"
        toolbarEnabled
      >
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
            title={pin.name}
            description={pin.address}
            pinColor={pin.verified ? '#D4B86A' : BRAND_NAVY}
            onCalloutPress={() => {
              const href = (pin.listingId ?? pin.id) as string;
              if (pin.listingId) {
                router.push(`/task/${href}` as Href);
                return;
              }
              router.push(`/business/${href}` as Href);
            }}
          />
        ))}
      </MapView>

      {pins.length === 0 ? (
        <View style={[styles.emptyOverlay, { backgroundColor: Colors.overlayLight }]}>
          <Text style={[styles.emptyText, { color: Colors.textPrimary }]}>
            {t('map.noPinsInArea')}
          </Text>
          <Text style={[styles.emptyHint, { color: Colors.textSecondary }]}>
            {t('map.noPinsHint')}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 360,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  emptyOverlay: {
    position: 'absolute',
    left: Spacing[4],
    right: Spacing[4],
    bottom: Spacing[6],
    padding: Spacing[4],
    borderRadius: Radius.lg,
  },
  emptyText: {
    ...Typography.bodySmall,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
  },
  emptyHint: {
    ...Typography.caption,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing[2],
  },
  tilesBanner: {
    position: 'absolute',
    top: Spacing[2],
    left: Spacing[3],
    right: Spacing[3],
    zIndex: 2,
    padding: Spacing[3],
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  tilesBannerText: {
    ...Typography.caption,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '600',
  },
});
