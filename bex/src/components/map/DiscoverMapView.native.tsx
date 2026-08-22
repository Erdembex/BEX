import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { router, Href } from 'expo-router';
import { getCityMapBounds } from '@/lib/cityMapRegion';
import { clampMapRegion, type MapRegion } from '@/lib/mapRegionUtils';
import { Typography, Radius, Spacing, useThemeColors } from '@/theme';
import type { MapBusinessPin } from './types';

type Props = {
  city: string;
  initialRegion: MapRegion;
  pins: MapBusinessPin[];
};

export function DiscoverMapView({ city, initialRegion, pins }: Props) {
  const Colors = useThemeColors();
  const mapRef = useRef<MapView>(null);
  const bounds = useMemo(() => getCityMapBounds(city), [city]);

  useEffect(() => {
    if (!mapRef.current || pins.length === 0) return;

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
  }, [pins, bounds.neighborhoodLatDelta, bounds.neighborhoodLngDelta]);

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

  const googleMapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapProvider =
    Platform.OS === 'android' && googleMapsKey ? PROVIDER_GOOGLE : undefined;

  return (
    <View style={styles.wrap}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={mapProvider}
        initialRegion={initialRegion}
        onRegionChangeComplete={onRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton
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
            pinColor={pin.verified ? '#D4B86A' : '#051F45'}
            onCalloutPress={() => router.push(`/business/${pin.id}` as Href)}
          />
        ))}
      </MapView>

      {pins.length === 0 ? (
        <View style={[styles.emptyOverlay, { backgroundColor: Colors.overlayLight }]}>
          <Text style={[styles.emptyText, { color: Colors.textPrimary }]}>
            Bu bölgede haritada gösterilecek işletme bulunamadı.
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
});
