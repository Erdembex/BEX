import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  TURKEY_CITIES,
  formatLocationLabel,
  getDistrictsForCity,
} from '@/constants/turkeyLocations';
import {
  LOCATION_ALL,
  formatFilterLocationLabel,
  isLocationAll,
  getLocationAllLabel,
  formatLocationOptionLabel,
} from '@/lib/locationFilterUtils';
import { resolveLocationFromDevice, getDeviceLocationErrorMessage } from '@/hooks/useDeviceLocation';
import { LocationSelectorModal } from '@/components/common/LocationSelectorModal';
import { Typography, Radius, Spacing, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';
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
  error?: string;
  /** Kayıt ekranı girişteki lacivert butonu kullanır */
  buttonColor?: string;
  /** Kayıt sheet'i: beyaz pill alanlar. Diğer ekranlar temayı kullanır. */
  appearance?: 'default' | 'sheet';
};

function SelectField({
  label,
  value,
  placeholder,
  onPress,
  disabled,
  highlight,
  appearance = 'default',
}: {
  label: string;
  value: string | null;
  placeholder: string;
  onPress: () => void;
  disabled?: boolean;
  highlight?: boolean;
  appearance?: 'default' | 'sheet';
}) {
  const styles = useScreenStyles();
  const sheet = appearance === 'sheet';
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, sheet && sheetStyles.label]}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.field,
          sheet && sheetStyles.field,
          disabled && styles.fieldDisabled,
          highlight && styles.fieldHighlight,
          highlight && sheet && sheetStyles.fieldHighlight,
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.fieldValue,
            sheet && sheetStyles.value,
            !value && styles.fieldPlaceholder,
            !value && sheet && sheetStyles.placeholder,
          ]}
        >
          {value || placeholder}
        </Text>
        {sheet ? (
          <Ionicons name="chevron-down" size={18} color={SHEET_MUTED} />
        ) : (
          <Text style={styles.chevron}>▼</Text>
        )}
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
  error,
  buttonColor,
  appearance = 'default',
}: LocationFieldsProps) {
  const styles = useScreenStyles();
  const Colors = useThemeColors();
  const [cityModal, setCityModal] = useState(false);
  const [districtModal, setDistrictModal] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsHint, setGpsHint] = useState('');
  const [districtManualRequired, setDistrictManualRequired] = useState(false);
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
    setDistrictManualRequired(false);
    try {
      const result = await resolveLocationFromDevice();
      onCityChange(result.city);
      if (showAllOption) {
        onDistrictChange(LOCATION_ALL);
        setGpsHint(t('locationPicker.gpsDetectedAll', { city: result.city }));
      } else if (result.district) {
        onDistrictChange(result.district);
        setGpsHint(
          t('locationPicker.gpsDetectedFull', {
            location: formatLocationLabel(result.city, result.district),
          })
        );
      } else {
        onDistrictChange(null);
        setDistrictManualRequired(true);
        setGpsHint(
          t('locationPicker.gpsDistrictManualRequired', { city: result.city })
        );
        setDistrictModal(true);
      }
    } catch (err: unknown) {
      setGpsHint(getDeviceLocationErrorMessage(err));
    } finally {
      setGpsLoading(false);
    }
  };

  const summary = showAllOption
    ? formatFilterLocationLabel(city, district)
    : formatLocationLabel(city, district);

  const cityDisplay = city ? formatLocationOptionLabel(city) : null;
  const districtDisplay =
    showAllOption && city && isLocationAll(city)
      ? getLocationAllLabel()
      : district
        ? formatLocationOptionLabel(district)
        : null;
  const districtDisabled = !city || (showAllOption && isLocationAll(city));

  const sheet = appearance === 'sheet';
  const gpsLabel = t('locationPicker.useMyLocation').replace(/^📍\s*/, '');

  return (
    <View style={styles.wrap}>
      {showGps ? (
        <TouchableOpacity
          style={[
            styles.gpsBtn,
            sheet && sheetStyles.gpsBtn,
            !sheet && buttonColor ? { backgroundColor: buttonColor } : null,
          ]}
          onPress={handleGps}
          disabled={gpsLoading}
          activeOpacity={0.85}
        >
          {gpsLoading ? (
            <ActivityIndicator
              color={sheet ? SHEET_INK : buttonColor ? '#FFFFFF' : Colors.textOnPrimary}
              size="small"
            />
          ) : sheet ? (
            <>
              <Ionicons name="location-outline" size={18} color={SHEET_INK} />
              <Text style={sheetStyles.gpsText}>{gpsLabel}</Text>
            </>
          ) : (
            <Text style={[styles.gpsBtnText, buttonColor ? { color: '#FFFFFF' } : null]}>
              {t('locationPicker.useMyLocation')}
            </Text>
          )}
        </TouchableOpacity>
      ) : null}

      <SelectField
        label={required ? t('locationPicker.cityLabelRequired') : t('locationPicker.cityLabel')}
        value={cityDisplay}
        placeholder={t('locationPicker.cityPlaceholder')}
        onPress={() => setCityModal(true)}
        appearance={appearance}
      />

      <SelectField
        label={required ? t('locationPicker.districtLabelRequired') : t('locationPicker.districtLabel')}
        value={districtDisplay}
        placeholder={
          districtManualRequired && !district
            ? t('locationPicker.districtManualPlaceholder')
            : !city
              ? t('locationPicker.districtFirstSelectCity')
              : isLocationAll(city)
                ? getLocationAllLabel()
                : showAllOption
                  ? t('locationPicker.districtOrAll')
                  : t('locationPicker.districtPlaceholder')
        }
        onPress={() => {
          setDistrictManualRequired(false);
          setDistrictModal(true);
        }}
        disabled={districtDisabled}
        highlight={districtManualRequired && !district}
        appearance={appearance}
      />

      {summary && !allowClear && !sheet ? (
        <Text style={styles.summary}>{t('locationPicker.selected', { summary })}</Text>
      ) : null}

      {allowClear && summary ? (
        <Text style={styles.filterSummary}>{t('locationPicker.filter', { summary })}</Text>
      ) : null}

      {gpsHint ? (
        <Text
          style={[
            styles.gpsHint,
            sheet && sheetStyles.hint,
            districtManualRequired && styles.gpsHintWarning,
            districtManualRequired && sheet && sheetStyles.hintWarning,
          ]}
        >
          {gpsHint}
        </Text>
      ) : null}
      {error ? <Text style={[styles.error, sheet && sheetStyles.error]}>{error}</Text> : null}

      <LocationSelectorModal
        visible={cityModal}
        title={t('locationPicker.selectCityTitle')}
        items={cityItems}
        selected={city}
        searchPlaceholder={t('locationPicker.selectCitySearchPlaceholder')}
        onClose={() => setCityModal(false)}
        formatLabel={formatLocationOptionLabel}
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
        selected={district}
        searchPlaceholder={t('locationPicker.selectDistrictSearchPlaceholder')}
        formatLabel={formatLocationOptionLabel}
        onClose={() => setDistrictModal(false)}
        onSelect={(item) => {
          onDistrictChange(item);
          setDistrictManualRequired(false);
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
};

/** Görev keşfet — il/ilçe filtresi (81 il, 973 ilçe + GPS) */
export function LocationFilter({
  city,
  district,
  onCityChange,
  onDistrictChange,
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
  buttonColor?: string;
  appearance?: 'default' | 'sheet';
};

/** Kayıt / profil — zorunlu il + ilçe (manuel veya GPS) */
export function LocationPicker({
  city,
  district,
  onCityChange,
  onDistrictChange,
  error,
  buttonColor,
  appearance = 'default',
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
      buttonColor={buttonColor}
      appearance={appearance}
    />
  );
}

const SHEET_INK = '#17264F';
const SHEET_LINE = '#C4B48A';
const SHEET_MUTED = '#64708C';

const sheetStyles = StyleSheet.create({
  label: {
    ...Typography.labelMedium,
    color: 'rgba(240,238,233,0.78)',
  },
  field: {
    minHeight: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: SHEET_LINE,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  fieldHighlight: {
    borderColor: '#B45309',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
  },
  value: {
    color: SHEET_INK,
    fontSize: 15,
  },
  placeholder: {
    color: SHEET_MUTED,
  },
  gpsBtn: {
    flexDirection: 'row',
    gap: Spacing[2],
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#F0EEE9',
    borderRadius: Radius.full,
    minHeight: 48,
  },
  gpsText: {
    ...Typography.labelMedium,
    color: '#F0EEE9',
    fontWeight: '700',
  },
  hint: {
    color: 'rgba(240,238,233,0.62)',
  },
  hintWarning: {
    color: '#B45309',
  },
  error: {
    color: '#B91C1C',
  },
});

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
  fieldHighlight: {
    borderColor: Colors.warning,
    backgroundColor: Colors.warningLight,
  },
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
  gpsHintWarning: {
    color: Colors.warning,
    fontWeight: '600',
  },
  error: {
    ...Typography.caption,
    color: Colors.error,
  },
}));

export type { TurkeyCity } from '@/constants/turkeyLocations';
