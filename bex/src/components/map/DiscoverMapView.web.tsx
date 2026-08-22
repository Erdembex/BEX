import React, { useMemo, createElement } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { router, Href } from 'expo-router';
import { Typography, Spacing, Radius, createThemedStyles } from '@/theme';
import { useTranslation } from '@/i18n';
import type { MapRegion } from '@/lib/mapRegionUtils';
import type { MapBusinessPin } from './types';

type Props = {
  city: string;
  initialRegion?: MapRegion;
  pins: MapBusinessPin[];
};

const useStyles = createThemedStyles((Colors) => ({
  wrap: { flex: 1, padding: Spacing[4], gap: Spacing[3] },
  note: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  card: {
    padding: Spacing[4],
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderGold,
    gap: Spacing[1],
  },
  name: { ...Typography.labelLarge, color: Colors.textPrimary, fontWeight: '700' },
  address: { ...Typography.caption, color: Colors.textSecondary },
  mapLink: { ...Typography.caption, color: Colors.primary, fontWeight: '700', marginTop: Spacing[1] },
  mapFrame: {
    width: '100%',
    height: 320,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderGold,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
}));

export function DiscoverMapView({ city, initialRegion, pins }: Props) {
  const styles = useStyles();
  const { t } = useTranslation();

  const center = useMemo(() => {
    if (pins.length > 0) {
      const lat = pins.reduce((sum, pin) => sum + pin.latitude, 0) / pins.length;
      const lng = pins.reduce((sum, pin) => sum + pin.longitude, 0) / pins.length;
      return { lat, lng };
    }
    if (initialRegion) {
      return { lat: initialRegion.latitude, lng: initialRegion.longitude };
    }
    return { lat: 41.0082, lng: 28.9784 };
  }, [pins, initialRegion]);

  const mapEmbedUrl = `https://www.google.com/maps?q=${center.lat},${center.lng}&z=13&output=embed`;

  const openInGoogleMaps = (pin: MapBusinessPin) => {
    const query = encodeURIComponent(`${pin.address}, Türkiye`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <View style={styles.mapFrame as object}>
      {createElement('iframe', {
        title: t('map.title'),
        src: mapEmbedUrl,
        width: '100%',
        height: '100%',
        style: { border: 0 },
        loading: 'lazy',
        referrerPolicy: 'no-referrer-when-downgrade',
      })}
      </View>
      <Text style={styles.note}>{t('map.webFallback', { city })}</Text>
      {pins.map((pin) => (
        <TouchableOpacity
          key={pin.id}
          style={styles.card}
          activeOpacity={0.88}
          onPress={() => router.push(`/business/${pin.id}` as Href)}
        >
          <Text style={styles.name}>{pin.name}</Text>
          <Text style={styles.address}>{pin.address}</Text>
          <TouchableOpacity onPress={() => openInGoogleMaps(pin)} hitSlop={8}>
            <Text style={styles.mapLink}>Google Maps&apos;te aç</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
