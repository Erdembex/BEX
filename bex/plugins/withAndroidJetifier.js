const { withGradleProperties } = require('@expo/config-plugins');

/**
 * expo-location (io.nlopez.smartlocation) eski support-v4 sınıflarını kullanır.
 * EAS/production APK'da ActivityCompat bulunamadığı için konum çağrısı çökebilir.
 * Jetifier, Expo Go'da sorun olmayan bu native bağımlılığı AndroidX'e çevirir.
 */
function withAndroidJetifier(config) {
  return withGradleProperties(config, (cfg) => {
    const props = cfg.modResults;
    const existing = props.find(
      (item) => item.type === 'property' && item.key === 'android.enableJetifier'
    );
    if (existing) {
      existing.value = 'true';
    } else {
      props.push({
        type: 'property',
        key: 'android.enableJetifier',
        value: 'true',
      });
    }
    return cfg;
  });
}

module.exports = withAndroidJetifier;
