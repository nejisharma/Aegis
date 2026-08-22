# Aegis Intel (mobile)

Store listing name (App Store + Google Play): **Aegis Threat Intel** ("Aegis" and "Aegis Intel" are taken on the App Store). Home-screen label (`expo.name`): "Aegis Intel". Bundle/package: `ca.neeraj.aegis`. iOS subtitle / Play short description: "CVEs, KEV, APTs & threat news".

iOS / Android companion to [aegis.neeraj.ca](https://aegis.neeraj.ca). Expo SDK 57 (managed, CNG), expo-router, TypeScript. Talks only to the website's `/api/*` routes, so no third-party API keys ship in the binary.

Design spec: `../docs/superpowers/specs/2026-08-21-aegis-mobile-design.md`.

## What is in the app

| Tab | Screens |
|---|---|
| Home | Simulated live threat map (MapLibre, CartoDB dark tiles, Survey-of-India boundary overlay), severity stats, latest critical CVEs |
| News | Aggregated feed (BleepingComputer, Krebs, The Hacker News, SecurityWeek) with source filter, in-app reader |
| Search | CVE (NVD) · IOC (ThreatFox, URLhaus, AbuseIPDB, MalwareBazaar, VirusTotal) · IP Intel (GeoIP + Shodan InternetDB) · Exploits (GitHub Advisory DB) |
| Intel | APT Tracker, MITRE ATT&CK (tactic → technique drill-down), Ransomware, Malware Bazaar, Phishing feed, Vuln Calendar, Analytics |
| Settings | Push notification toggles (Critical CVEs, News digest), links |
| Phish or Not? | Swipe game: 10 cards per round (3 easy / 4 medium / 3 hard) drawn from 300 hand-written phishing/legit messages in `src/data/phish-cards.ts`; tells shown after each swipe; personal best persisted |
| Sidebar | Hamburger on every tab opens a drawer listing every page |
| Watchlist | Keywords/products the user follows: matching CVEs from the last 30 days, plus push alerts for new ones (category `watchlist`) |
| Extras | Pull-to-refresh everywhere, "Updated 3m ago" stamps, share sheet on CVEs/news, haptics + daily streak + review prompt in the game, Dark/Light/System theme, two-column Home on tablets, universal links (`https://aegis.neeraj.ca/cve/CVE-...` opens the app) |

Everything fetched is cached to AsyncStorage, so each screen renders the last data instantly and offline.

## Push notifications

Server side lives in the web repo: `src/app/api/push/*`, `src/app/api/cron/notify`, `src/lib/push/*`, `vercel.json` (cron every 30 min). State is in Upstash Redis. See the root README for the env vars.

## Local development (Windows)

```bash
cd mobile
npm install --legacy-peer-deps
npm test
npx tsc --noEmit
```

Android, on the `pixel` AVD (SDK at `D:\dev\android-sdk`, JDK = Android Studio's JBR):

```bash
set ANDROID_HOME=D:\dev\android-sdk
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
npx expo run:android
```

`expo run:android` runs `prebuild` (generates `android/`, which is git-ignored), builds the debug APK, installs it and starts Metro. Expo Go does **not** work — MapLibre and notifications need a dev build.

Point the app at a local API with `.env` (`EXPO_PUBLIC_API_URL=http://10.0.2.2:3000` for the emulator → `npm run dev` in the web repo).

## iOS

Built on Codemagic (`../codemagic.yaml` at the repo root, workflow `ios-testflight`) because this machine is Windows. One-time setup is listed at the top of that file. The iOS widget target is opt-in via `IOS_WIDGET=1` (see `app.config.js`); the first TestFlight build ships without it.

## Store submission checklist (NEEDS-CONFIG)

1. **Expo project id** — `npx eas-cli@latest init` inside `mobile/` writes `extra.eas.projectId` into `app.json`. Push tokens need it.
2. **Android push (FCM)** — Firebase project → Android app `ca.neeraj.aegis` → download `google-services.json` into `mobile/` and add `"googleServicesFile": "./google-services.json"` under `expo.android` in `app.json`; upload the FCM V1 service-account key to Expo (`eas credentials`). Without this, Android push silently does nothing.
3. **iOS push (APNs)** — `eas credentials` → iOS → push key; Expo uploads it to Apple. Needs the paid developer account.
4. **Upstash Redis + CRON_SECRET** on Vercel (root README). Until set, the push routes return `{skipped:"no redis"}`.
5. **Icons / splash** — `assets/icon.png`, `assets/android-icon-*.png`, `assets/splash-icon.png` are still the Expo template placeholders; replace with the Aegis shield.
6. **App Store Connect record** for `ca.neeraj.aegis`, then set `APP_ID` in `codemagic.yaml`.
7. **Privacy labels** — declare "Device ID (push token) — App Functionality, not linked to user". Nothing else is collected.
8. **Review notes** — mention that the threat map is simulated/visualised activity, that Malware Bazaar shows metadata only, and that phishing URLs are never opened by the app.
9. **Crash reporting (optional)** — create a Sentry project and set `EXPO_PUBLIC_SENTRY_DSN` (in `.env` locally / the `aegis-env` group on Codemagic). Without it Sentry is completely disabled (`src/lib/monitoring.ts`).
10. **Android upload key** — already generated at `D:\PLAY STORE IMPORTANT\Aegis\upload.jks` (password in `upload-keystore-password.txt`, base64 for Codemagic in `upload-keystore-base64-for-codemagic.txt`). Local release builds read it from `~/.gradle/gradle.properties` (`AEGIS_UPLOAD_*`, already written on this machine) via `plugins/withReleaseSigning.js`. Build: `cd android && ./gradlew bundleRelease` → `android/app/build/outputs/bundle/release/app-release.aab`. **Never lose this keystore** — Play requires the same upload key for every update.
11. **Universal links** — Android: `public/.well-known/assetlinks.json` already contains this upload key's SHA-256; if Play App Signing re-signs the app, also add the *Play* signing certificate fingerprint from the Play Console. iOS: replace `TEAMID` in `public/.well-known/apple-app-site-association` with your Apple Team ID (Apple Developer → Membership). Both files must be deployed on aegis.neeraj.ca before the OS opens links in the app.
12. **iOS verification** — everything has been verified on the Android emulator only; run the Codemagic `ios-testflight` workflow (or a Mac simulator) and check the Search keyboard/safe-areas and the game's swipe thresholds on iPhone.

## Ads

None in v1 by decision. `AdSlot` in `src/components/ui.tsx` is the single seam; screens already render `<AdSlot placement="…" />` where a banner could go.

## Widgets

A home-screen widget **"Aegis · Critical CVEs"** shows the 3 newest CVSS-critical CVEs of the last 7 days (id, CVSS, one-line summary) plus how many recent CVEs hit the user's watchlist terms. Tapping a row opens `aegis://cve/<ID>`; tapping elsewhere opens the app.

Shared code lives in `src/widgets/`:

- `data.ts` — `WidgetPayload` type, `buildWidgetPayload()` (network), watchlist term matching, `writeWidgetPayload()` / `readWidgetPayload()` (AsyncStorage; on iOS also mirrored into the App Group `UserDefaults` through `ExtensionStorage` from `@bacons/apple-targets`).
- `refresh.ts` — `refreshWidgets()`, called from `app/_layout.tsx` on every launch once the cache is hydrated.

**Android** (`react-native-android-widget`): `CriticalCveWidget.tsx` is the Flex/Text widget tree, `widgetTaskHandler.ts` is the headless task (paints the cached payload, fetches, repaints). It is registered in the custom entry `index.ts` (`package.json` → `"main": "./index.ts"`, which still imports `expo-router/entry`). The widget is declared in `app.json` under the `react-native-android-widget` plugin (`name: CriticalCve`, 4×2 cells, `updatePeriodMillis: 1800000` = 30 min system refresh, preview `assets/widget-preview.png`). Requires a prebuild (`expo run:android`).

**iOS** (`@bacons/apple-targets`): `targets/widget/` holds `expo-target.config.js` (type `widget`, App Group `group.ca.neeraj.aegis`, colors), `Info.plist` and `Widget.swift` (WidgetKit `TimelineProvider` reading the JSON payload from the App Group, small + medium families, `Link`/`widgetURL` deep links). `app.json` declares `ios.entitlements["com.apple.security.application-groups"]` and the plugin. **Replace the `TEAMID` placeholder** (`ios.appleTeamId` and the `@bacons/apple-targets` plugin option in `app.json`) with the real Apple Team ID before building.

**iOS is untested** — this machine is Windows, so the Swift target has never been compiled. Verify on the Codemagic `ios-testflight` workflow or in Xcode (`npx expo prebuild -p ios --clean`, then open the `expo:targets/widget` group).
