const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const NETWORK_CONFIG = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="true">
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </base-config>
</network-security-config>`;

/**
 * Preview/emulator HTTP (127.0.0.1, 10.0.2.2, LAN) icin cleartext ac.
 * Production derlemelerinde devre disi: yayin APK/AAB'si sadece HTTPS kullanir.
 */
function withAndroidCleartext(config) {
  if (process.env.APP_VARIANT === 'production') {
    return config;
  }

  config = withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (app) {
      app.$['android:usesCleartextTraffic'] = 'true';
      app.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    }
    return cfg;
  });

  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const xmlDir = path.join(cfg.modRequest.platformProjectRoot, 'app/src/main/res/xml');
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(path.join(xmlDir, 'network_security_config.xml'), NETWORK_CONFIG);
      return cfg;
    },
  ]);
}

module.exports = withAndroidCleartext;
