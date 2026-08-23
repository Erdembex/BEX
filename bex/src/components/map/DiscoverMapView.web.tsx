import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { router, Href } from 'expo-router';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';
import type { MapRegion } from '@/lib/mapRegionUtils';
import type { MapBusinessPin } from './types';
import 'leaflet/dist/leaflet.css';

type Props = {
  city: string;
  focusDistrict?: string | null;
  initialRegion?: MapRegion;
  pins: MapBusinessPin[];
};

const pinIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapViewport({
  initialRegion,
  pins,
  lockDistrict,
}: {
  initialRegion?: MapRegion;
  pins: MapBusinessPin[];
  lockDistrict: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (pins.length > 0) {
      const bounds = L.latLngBounds(pins.map((pin) => [pin.latitude, pin.longitude] as [number, number]));
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: lockDistrict ? 14 : 13 });
      return;
    }
    if (initialRegion) {
      map.setView([initialRegion.latitude, initialRegion.longitude], 13);
    }
  }, [pins, initialRegion, lockDistrict, map]);

  return null;
}

export function DiscoverMapView({ city, focusDistrict, initialRegion, pins }: Props) {
  const styles = useStyles();
  const Colors = useThemeColors();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const lockDistrict = Boolean(focusDistrict?.trim());

  useEffect(() => {
    setMounted(true);
  }, []);

  const center = useMemo(() => {
    if (initialRegion) {
      return [initialRegion.latitude, initialRegion.longitude] as [number, number];
    }
    if (pins.length > 0) {
      return [pins[0].latitude, pins[0].longitude] as [number, number];
    }
    return [41.0082, 28.9784] as [number, number];
  }, [initialRegion, pins]);

  if (!mounted) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>{t('map.title')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.mapFrame}>
        <MapContainer center={center} zoom={13} style={{ width: '100%', height: '100%' }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapViewport initialRegion={initialRegion} pins={pins} lockDistrict={lockDistrict} />
          {pins.map((pin) => (
            <Marker
              key={pin.id}
              position={[pin.latitude, pin.longitude]}
              icon={pinIcon}
              eventHandlers={{
                click: () => {
                  const href = pin.listingId ?? pin.id;
                  router.push(`/task/${href}` as Href);
                },
              }}
            >
              <Popup>
                <strong>{pin.name}</strong>
                <br />
                {pin.address}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </View>

      {pins.length === 0 ? (
        <View style={[styles.emptyOverlay, { backgroundColor: Colors.overlayLight }]}>
          <Text style={[styles.emptyText, { color: Colors.textPrimary }]}>
            Bu bölgede haritada gösterilecek ilan bulunamadı.
          </Text>
        </View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
        {pins.map((pin) => (
          <TouchableOpacity
            key={`card-${pin.id}`}
            style={styles.card}
            activeOpacity={0.88}
            onPress={() => router.push(`/task/${pin.listingId ?? pin.id}` as Href)}
          >
            <Text style={styles.name}>{pin.name}</Text>
            <Text style={styles.address} numberOfLines={2}>
              {pin.address}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const useStyles = createThemedStyles((Colors) => ({
  wrap: { flex: 1, minHeight: 360 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 360 },
  loadingText: { ...Typography.bodyMedium, color: Colors.textSecondary },
  mapFrame: {
    flex: 1,
    minHeight: 360,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderGold,
  },
  emptyOverlay: {
    position: 'absolute',
    left: Spacing[4],
    right: Spacing[4],
    top: Spacing[4],
    padding: Spacing[4],
    borderRadius: Radius.lg,
  },
  emptyText: {
    ...Typography.bodySmall,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
  },
  carousel: {
    gap: Spacing[3],
    paddingTop: Spacing[3],
    paddingHorizontal: Spacing[1],
  },
  card: {
    width: 220,
    padding: Spacing[4],
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderGold,
    gap: Spacing[1],
  },
  name: { ...Typography.labelLarge, color: Colors.textPrimary, fontWeight: '700' },
  address: { ...Typography.caption, color: Colors.textSecondary },
}));
