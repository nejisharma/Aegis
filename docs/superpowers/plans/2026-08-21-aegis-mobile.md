# Aegis Mobile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Native iOS/Android Aegis app (Expo) with parity to aegis.neeraj.ca plus push notifications, backed by the existing Next.js API routes.

**Architecture:** `mobile/` Expo SDK 54 + expo-router app talks only to `https://aegis.neeraj.ca/api/*`. The web repo gains three push routes, a Vercel cron, and Upstash Redis state. Map = MapLibre with CartoDB dark tiles + the site's India SOI boundary GeoJSON.

**Tech Stack:** Expo 54, React Native 0.81, expo-router, swr, @react-native-async-storage/async-storage, @maplibre/maplibre-react-native, expo-notifications, expo-web-browser, react-native-svg (charts), lucide-react-native, jest-expo. Web: @upstash/redis, expo-server-sdk.

## Global Constraints

- App name `Aegis`; bundle/package `ca.neeraj.aegis`; scheme `aegis`.
- `ios/` and `android/` never committed (CNG). `mobile/.gitignore` covers them.
- Mobile never calls third-party APIs directly; base URL from `EXPO_PUBLIC_API_URL` (default `https://aegis.neeraj.ca`).
- No ads. `AdSlot` renders `null`.
- Dark theme only (`userInterfaceStyle: "dark"`), palette from web: bg `#060a13`, surface `#0b1220`, border `#1e293b`, text `#e2e8f0`, muted `#64748b`, accent cyan `#22d3ee`, severity low `#3b82f6` / medium `#eab308` / high `#f97316` / critical `#ef4444`.
- Notification categories: exactly `critical_cve`, `news_digest`.
- Android local toolchain: `ANDROID_HOME=D:\dev\android-sdk`, `JAVA_HOME=C:\Program Files\Android\Android Studio\jbr`, AVD `pixel`.

---

## File Structure

See spec §Architecture. Summary of responsibilities:

| Path | Responsibility |
|---|---|
| `mobile/src/api/client.ts` | `api<T>(path, init?)`: base URL, 10 s timeout, `ApiError` |
| `mobile/src/api/endpoints.ts` | `getNews(source?)`, `searchCves(keyword, limit)`, `getCve(id)`, `getGeoIp(ip)`, `getShodan(ip)`, `getAbuseIpdb(ip)`, `threatfox(body)`, `urlhaus(body)`, `malwareBazaar(body)`, `getMitre()`, `searchExploits(keyword)`, `getRansomware()`, `getPhishing()`, `urlscan(url)`, `registerPush(...)`, `updatePushPrefs(...)` |
| `mobile/src/api/types.ts` | types copied from web `src/types/*` + `RansomwareResponse`, `ExploitsResponse`, `PhishingResponse`, `AbuseIpdbResult`, `PushPrefs` |
| `mobile/src/lib/*` | pure logic (simulator, geo, cvss, ioc, patch-dates) — unit tested |
| `mobile/src/lib/storage.ts` | `swrCacheProvider()` persisted to AsyncStorage; `prefs` get/set |
| `mobile/src/notifications/*` | register, prefs sync, tap handling |
| `mobile/src/components/*` | shared UI |
| `mobile/app/**` | screens |
| `src/lib/push/*` (web) | redis, expo-push, detectors |
| `src/app/api/push/*`, `src/app/api/cron/notify` (web) | routes |

---

### Task 1: Web backend — push routes, cron, Redis

**Files:** Create `src/lib/push/redis.ts`, `src/lib/push/expo-push.ts`, `src/lib/push/detectors.ts`, `src/lib/push/detectors.test.ts`, `src/app/api/push/register/route.ts`, `src/app/api/push/prefs/route.ts`, `src/app/api/cron/notify/route.ts`, `vercel.json`. Modify `package.json` (add `@upstash/redis`, `expo-server-sdk`, `tsx` dev, script `test:push`), `README.md` (env vars + cleanup), remove `mappls-web-maps`, `ol`.

**Interfaces (produces):**
- `POST /api/push/register` body `{token: string, platform: 'ios'|'android', prefs: {critical_cve: boolean, news_digest: boolean}}` → `{ok: true}`
- `PATCH /api/push/prefs` body `{token, prefs}` → `{ok: true}`; `DELETE /api/push/prefs` body `{token}` → `{ok: true}`
- `GET /api/cron/notify` header `Authorization: Bearer $CRON_SECRET` → `{cve: number, digest: boolean}` or `{skipped: 'no redis'}`
- Redis keys: hash `devices` (token → JSON `{platform, prefs, updatedAt}`), set `seen:cve`, set `seen:news`, string `last_digest` (ISO).
- `detectors.ts`: `pickNewCriticalCves(vulns: CVEItem[], seen: Set<string>, max=5): CVEItem[]`; `buildDigest(items: NewsItem[], seen: Set<string>, lastDigestIso: string|null, now: Date): {count: number, newest: NewsItem, newIds: string[]} | null`.

Steps: write detectors test (`node --test --import tsx`), fail, implement, pass; implement redis/expo-push/routes; `npm run build` passes; commit.

### Task 2: Expo scaffold + theme + API client

**Files:** `mobile/` via `npx create-expo-app@latest mobile --template blank-typescript`, then add expo-router, deps, `app.json`, `eas.json`, `.gitignore`, `src/theme/*`, `src/api/client.ts`, `src/api/types.ts`, `src/api/endpoints.ts`, `src/lib/storage.ts`, `app/_layout.tsx`, `app/(tabs)/_layout.tsx` with 5 placeholder tabs, `jest.config.js`, `__tests__/client.test.ts`.

Deliverable: `npx expo run:android` boots to a dark 5-tab shell on the `pixel` AVD; `npm test` passes.

### Task 3: Pure libs (simulator, geo, cvss, ioc, patch-dates) with tests

**Files:** `mobile/src/lib/threat-simulator.ts`, `geo.ts`, `cvss.ts`, `ioc.ts`, `patch-dates.ts`, `mobile/__tests__/lib.test.ts`.

Interfaces: `generateThreatEvent(): ThreatEvent`; `severityColor(s): string`; `cvssSeverity(score): 'NONE'|'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'`; `detectIocType(q): 'ip'|'domain'|'url'|'hash'|'unknown'`; `generatePatchDates(now): PatchDate[]` (same shape as web).

### Task 4: Shared components

`StatCard`, `CVSSBadge`, `SeverityDot`, `ListRow`, `Skeleton`, `EmptyState`, `SearchBar`, `Segmented`, `OfflineBanner`, `Chip`, `SectionHeader`, `AdSlot`, `Screen` (safe-area + bg). All in `mobile/src/components/`.

### Task 5: Home tab — ThreatMap (MapLibre) + stats + critical CVEs

`mobile/src/components/ThreatMap.tsx`, `mobile/src/hooks/useSimulatedThreats.ts`, `mobile/app/(tabs)/index.tsx`, `mobile/assets/india-boundary.geojson` (copied). Raster source `https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png`, `LineLayer` for boundary with `lineColor:#4a4a4a, lineWidth:0.8, lineOpacity:0.6`, `ShapeSource` for events.

### Task 6: News tab + reader

`mobile/app/(tabs)/news.tsx`, `mobile/src/hooks/useNews.ts`, open links with `expo-web-browser`. Source filter chips; pull-to-refresh.

### Task 7: Search tab — CVE, IOC, IP, Exploits + CVE detail

`mobile/app/(tabs)/search.tsx`, `mobile/app/cve/[id].tsx`, hooks `useCveSearch`, `useIocLookup` (ThreatFox + URLhaus + AbuseIPDB by type), `useIpIntel` (geoip + shodan), `useExploits`.

### Task 8: Intel tab + APT, Ransomware, Malware, Phishing, Calendar, Analytics

`mobile/app/(tabs)/intel.tsx` grid; `apt/index.tsx`, `apt/[id].tsx`, `ransomware.tsx`, `malware.tsx`, `phishing.tsx`, `calendar.tsx`, `analytics.tsx` (bars via react-native-svg: CVSS distribution from a `searchCves('', 100)`-style recent query, top attacking/targeted from simulator weights like web).

### Task 9: MITRE drill-down

`mitre/index.tsx` (tactics list with technique count), `mitre/[tactic].tsx` (techniques colored by # APT groups using them), `mitre/technique/[id].tsx` (description, platforms, groups using it).

### Task 10: Notifications + Settings

`mobile/src/notifications/{register,prefs,handlers}.ts`, `mobile/app/(tabs)/settings.tsx`, `app.json` expo-notifications plugin, deep-link handling in `app/_layout.tsx`.

### Task 11: Build config, docs, emulator verification

`mobile/codemagic.yaml`, `mobile/README.md` (build, store submission, env, NEEDS-CONFIG: FCM `google-services.json`, APNs key, Upstash, CRON_SECRET, Expo projectId), root README section. Run full emulator walkthrough with screenshots; run `npm test` in both; commit.
