const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Adds a `release` signing config that reads the upload keystore from Gradle properties
 * (AEGIS_UPLOAD_STORE_FILE, AEGIS_UPLOAD_STORE_PASSWORD, AEGIS_UPLOAD_KEY_ALIAS, AEGIS_UPLOAD_KEY_PASSWORD),
 * typically set in ~/.gradle/gradle.properties so nothing secret is committed. Falls back to the
 * debug key when they are absent, so plain `expo run:android` keeps working.
 */
module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;
    if (gradle.includes('AEGIS_UPLOAD_STORE_FILE')) return cfg;

    gradle = gradle.replace(
      /signingConfigs \{\s*debug \{[\s\S]*?\}\s*\}/,
      (block) =>
        block.replace(
          /\}\s*\}$/,
          `}
        release {
            if (project.hasProperty('AEGIS_UPLOAD_STORE_FILE')) {
                storeFile file(AEGIS_UPLOAD_STORE_FILE)
                storePassword AEGIS_UPLOAD_STORE_PASSWORD
                keyAlias AEGIS_UPLOAD_KEY_ALIAS
                keyPassword AEGIS_UPLOAD_KEY_PASSWORD
            }
        }
    }`,
        ),
    );
    gradle = gradle.replace(
      /release \{\s*\/\/ Caution! In production, you need to generate your own keystore file\.[\s\S]*?signingConfig signingConfigs\.debug/,
      (block) =>
        block.replace(
          'signingConfig signingConfigs.debug',
          "signingConfig project.hasProperty('AEGIS_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug",
        ),
    );
    cfg.modResults.contents = gradle;
    return cfg;
  });
};
