// Wraps app.json. The iOS home-screen widget (a second signed target + App Group) is opt-in:
// set IOS_WIDGET=1 in the build environment to include it. The first TestFlight build ships
// without it so signing only involves the main bundle id.
const base = require('./app.json');

module.exports = ({ config }) => {
  const expo = { ...base.expo, ...config };
  if (process.env.IOS_WIDGET === '1') {
    const teamId = expo.ios.appleTeamId;
    const group = 'group.ca.neeraj.aegis';
    expo.plugins = [...expo.plugins, ['@bacons/apple-targets', { appleTeamId: teamId }]];
    expo.ios = { ...expo.ios, entitlements: { ...(expo.ios.entitlements ?? {}), 'com.apple.security.application-groups': [group] } };
    expo.extra = {
      ...expo.extra,
      eas: {
        ...(expo.extra?.eas ?? {}),
        build: {
          experimental: {
            ios: {
              appExtensions: [
                { bundleIdentifier: 'ca.neeraj.aegis.widget', targetName: 'AegisWidget', entitlements: { 'com.apple.security.application-groups': [group] } },
              ],
            },
          },
        },
      },
    };
  }
  return expo;
};
