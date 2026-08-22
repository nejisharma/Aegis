// iOS home-screen widget target for @bacons/apple-targets (generated into the Xcode project by `expo prebuild`).
// UNTESTED: this machine is Windows; build/verify on the Codemagic `ios-testflight` workflow or a Mac.
/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'AegisWidget',
  displayName: 'Aegis',
  icon: '../../assets/icon.png',
  deploymentTarget: '17.0',
  frameworks: ['SwiftUI', 'WidgetKit'],
  colors: {
    // Referenced by Info.plist / build settings (see README "Colors" table).
    $widgetBackground: '#0b1220',
    $accent: '#22d3ee',
    // Usable from SwiftUI as Color("cyan") etc.
    cyan: '#22d3ee',
    muted: '#94a3b8',
    rowBackground: '#111a2e',
    critical: '#ef4444',
  },
  entitlements: {
    // Shared with the main app (app.json -> ios.entitlements) so the widget can read the payload
    // the app writes via ExtensionStorage (UserDefaults suite).
    'com.apple.security.application-groups':
      (config.ios && config.ios.entitlements && config.ios.entitlements['com.apple.security.application-groups']) || [
        'group.ca.neeraj.aegis',
      ],
  },
});
