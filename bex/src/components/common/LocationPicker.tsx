import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  TURKEY_CITIES,
  formatLocationLabel,
  getDistrictsForCity,
} from '@/constants/turkeyLocations';
import {
  LOCATION_ALL,
  formatFilterLocationLabel,
  isLocationAll,
} from '@/lib/locationFilterUtils';
import { resolveLocationFromDevice } from '@/hooks/useDeviceLocation';
import { LocationSelectorModal } from '@/components/common/LocationSelectorModal';
import { Typography, Radius, Spacing, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';
import { router, Href } from 'expo-router';

type LocationFieldsProps = {
  city: string | null;
  district: string | null;
  onCityChange: (city: string | null) => void;
  onDistrictChange: (district: string | null) => void;
  /** Filtre modunda il/ilçe temizlenebilir */
  allowClear?: boolean;
  /** Kayıt/profil modunda il ve ilçe zorunlu */
  required?: boolean;
  showGps?: boolean;
  showMapPicker?: boolean;
  mapPickerReturnTo?: Href;
  error?: string;
};

function SelectField({
  label,
  value,
  placeholder,
  onPress,
  disabled,
}: {
  label: string;
  value: string | null;
  placeholder: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const styles = useScreenStyles();
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.field, disabled && styles.fieldDisabled]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text style={[styles.fieldValue, !value && styles.fieldPlaceholder]}>
          {value || placeholder}
        </Text>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>
    </View>
  );
}

function LocationFields({
  city,
  district,
  onCityChange,
  onDistrictChange,
  allowClear = false,
  required = false,
  showGps = true,
  showMapPicker = false,
  mapPickerReturnTo,
  error,
}: LocationFieldsProps) {
  const styles = useScreenStyles();
  const Colors = useThemeColors();
  const [cityModal, setCityModal] = useState(false);
  const [districtModal, setDistrictModal] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsHint, setGpsHint] = useState('');
  const { t } = useTranslation();

  const districts = city && !isLocationAll(city) ? getDistrictsForCity(city) : [];
  const showAllOption = allowClear;
  const cityItems = showAllOption ? [LOCATION_ALL, ...TURKEY_CITIES] : [...TURKEY_CITIES];
  const districtItems =
    showAllOption && city && !isLocationAll(city)
      ? [LOCATION_ALL, ...districts]
      : districts;

  const handleGps = async () => {
    setGpsLoading(true);
    setGpsHint('');
    try {
      const result = await resolveLocationFromDevice();
      onCityChange(result.city);
      onDistrictChange(showAllOption ? LOCATION_ALL : result.district);
      setGpsHint(
        showAllOption
          ? t('locationPicker.gpsDetectedAll', { city: result.city })
          : result.district
            ? t('locationPicker.gpsDetectedFull', { location: formatLocationLabel(result.city, result.district) })
            : t('locationPicker.gpsDetectedCityOnly', { city: result.city })
      );
    } catch (err: unknown) {
      setGpsHint(err instanceof Error ? err.message : t('locationPicker.gpsFailed'));
    } finally {
      setGpsLoading(false);
    }
  };

  const summary = showAllOption
    ? formatFilterLocationLabel(city, district)
    : formatLocationLabel(city, district);

  const districtValue =
    showAllOption && city && isLocationAll(city) ? LOCATION_ALL : district;
  const districtDisabled = !city || (showAllOption && isLocationAll(city));

  return (
    <View style={styles.wrap}>
      {showMapPicker ? (
        <TouchableOpacity
          style={styles.mapBtn}
          onPress={() => router.push('/map?pickFor=tasks' as Href)}
          activeOpacity={0.85}
        >
          <Text style={styles.mapBtnText}>{t('locationPicker.pickFromMap')}</Text>
        </TouchableOpacity>
      ) : null}

      {showGps ? (
        <TouchableOpacity
          style={styles.gpsBtn}
          onPress={handleGps}
          disabled={gpsLoading}
          activeOpacity={0.85}
        >
          {gpsLoading ? (
            <ActivityIndicator color={Colors.textOnPrimary} size="small" />
          ) : (
            <Text style={styles.gpsBtnText}>{t('locationPicker.useMyLocation')}</Text>
          )}
        </TouchableOpacity>
      ) : null}

      <SelectField
        label={required ? t('locationPicker.cityLabelRequired') : t('locationPicker.cityLabel')}
        value={city}
        placeholder={t('locationPicker.cityPlaceholder')}
        onPress={() => setCityModal(true)}
      />

      <SelectField
        label={required ? t('locationPicker.districtLabelRequired') : t('locationPicker.districtLabel')}
        value={districtValue}
        placeholder={
          !city
            ? t('locationPicker.districtFirstSelectCity')
            : isLocationAll(city)
              ? LOCATION_ALL
              : showAllOption
                ? t('locationPicker.districtOrAll')
                : t('locationPicker.districtPlaceholder')
        }
        onPress={() => setDistrictModal(true)}
        disabled={districtDisabled}
      />

      {summary && !allowClear ? (
        <Text style={styles.summary}>{t('locationPicker.selected', { summary })}</Text>
      ) : null}

      {allowClear && summary ? (
        <Text style={styles.filterSummary}>{t('locationPicker.filter', { summary })}</Text>
      ) : null}

      {gpsHint ? <Text style={styles.gpsHint}>{gpsHint}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <LocationSelectorModal
        visible={cityModal}
        title={t('locationPicker.selectCityTitle')}
        items={cityItems}
        selected={city}
        searchPlaceholder={t('locationPicker.selectCitySearchPlaceholder')}
        onClose={() => setCityModal(false)}
        onSelect={(item) => {
          onCityChange(item);
          if (showAllOption && isLocationAll(item)) {
            onDistrictChange(LOCATION_ALL);
          } else if (showAllOption) {
            onDistrictChange(LOCATION_ALL);
          } else {
            onDistrictChange(null);
          }
          setCityModal(false);
        }}
      />

      <LocationSelectorModal
        visible={districtModal}
        title={city && !isLocationAll(city) ? t('locationPicker.selectDistrictTitle', { city }) : t('locationPicker.selectDistrictTitleGeneric')}
        items={districtItems}
        selected={districtValue}
        searchPlaceholder={t('locationPicker.selectDistrictSearchPlaceholder')}
        onClose={() => setDistrictModal(false)}
        onSelect={(item) => {
          onDistrictChange(item);
          setDistrictModal(false);
        }}
      />
    </View>
  );
}

type LocationFilterProps = {
  city: string | null;
  district: string | null;
  onCityChange: (city: string | null) => void;
  onDistrictChange: (district: string | null) => void;
  showMapPicker?: boolean;
  mapPickerReturnTo?: Href;
};

/** Görev keşfet — il/ilçe filtresi (81 il, 973 ilçe + GPS) */
export function LocationFilter({
  city,
  district,
  onCityChange,
  onDistrictChange,
  showMapPicker = false,
  mapPickerReturnTo,
}: LocationFilterProps) {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  return (
    <View>
      <Text style={styles.sectionLabel}>{t('locationPicker.locationFilterLabel')}</Text>
      <LocationFields
        city={city}
        district={district}
        onCityChange={onCityChange}
        onDistrictChange={onDistrictChange}
        allowClear
        showGps
        showMapPicker={showMapPicker}
        mapPickerReturnTo={mapPickerReturnTo}
      />
    </View>
  );
}

type LocationPickerProps = {
  city: string;
  district: string;
  onCityChange: (city: string) => void;
  onDistrictChange: (district: string) => void;
  error?: string;
};

/** Kayıt / profil — zorunlu il + ilçe (manuel veya GPS) */
export function LocationPicker({
  city,
  district,
  onCityChange,
  onDistrictChange,
  error,
}: LocationPickerProps) {
  return (
    <LocationFields
      city={city || null}
      district={district || null}
      onCityChange={(c) => onCityChange(c ?? '')}
      onDistrictChange={(d) => onDistrictChange(d ?? '')}
      required
      showGps
      error={error}
    />
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  wrap: { gap: Spacing[3] },
  sectionLabel: {
    ...Typography.labelMedium,
    color: Colors.textPrimary,
    marginBottom: Spacing[1],
  },
  gpsBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  mapBtn: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: Spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderWidth: 1,
    borderColor: Colors.borderGold,
  },
  mapBtnText: {
    ...Typography.labelMedium,
    color: Colors.primary,
    fontWeight: '700',
  },
  gpsBtnText: {
    ...Typography.labelMedium,
    color: Colors.textOnPrimary,
    fontWeight: '700',
  },
  fieldWrap: { gap: Spacing[1] },
  fieldLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    minHeight: 48,
  },
  fieldDisabled: { opacity: 0.5 },
  fieldValue: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    flex: 1,
  },
  fieldPlaceholder: { color: Colors.textTertiary },
  chevron: { color: Colors.textTertiary, fontSize: 10, marginLeft: Spacing[2] },
  clearBtn: { alignSelf: 'flex-start' },
  clearText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  summary: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  filterSummary: {
    ...Typography.caption,
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  gpsHint: {
    ...Typography.caption,
    color: Colors.info,
  },
  error: {
    ...Typography.caption,
    color: Colors.error,
  },
}));

export type { TurkeyCity } from '@/constants/turkeyLocations';
