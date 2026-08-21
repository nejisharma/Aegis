# Aegis Mobile

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

Built on Codemagic (`codemagic.yaml`, workflow `ios-testflight`) because this machine is Windows. One-time setup is listed at the top of that file.

## Store submission checklist (NEEDS-CONFIG)

1. **Expo project id** — `npx eas-cli@latest init` inside `mobile/` writes `extra.eas.projectId` into `app.json`. Push tokens need it.
2. **Android push (FCM)** — Firebase project → Android app `ca.neeraj.aegis` → download `google-services.json` into `mobile/` and add `"googleServicesFile": "./google-services.json"` under `expo.android` in `app.json`; upload the FCM V1 service-account key to Expo (`eas credentials`). Without this, Android push silently does nothing.
3. **iOS push (APNs)** — `eas credentials` → iOS → push key; Expo uploads it to Apple. Needs the paid developer account.
4. **Upstash Redis + CRON_SECRET** on Vercel (root README). Until set, the push routes return `{skipped:"no redis"}`.
5. **Icons / splash** — `assets/icon.png`, `assets/android-icon-*.png`, `assets/splash-icon.png` are still the Expo template placeholders; replace with the Aegis shield.
6. **App Store Connect record** for `ca.neeraj.aegis`, then set `APP_ID` in `codemagic.yaml`.
7. **Privacy labels** — declare "Device ID (push token) — App Functionality, not linked to user". Nothing else is collected.
8. **Review notes** — mention that the threat map is simulated/visualised activity, that Malware Bazaar shows metadata only, and that phishing URLs are never opened by the app.

## Ads

None in v1 by decision. `AdSlot` in `src/components/ui.tsx` is the single seam; screens already render `<AdSlot placement="…" />` where a banner could go.
