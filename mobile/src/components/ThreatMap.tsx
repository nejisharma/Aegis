import { useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, GeoJSONSource, Layer, Map as MapLibreMap, type CameraRef, type MapRef } from '@maplibre/maplibre-react-native';
import { Maximize2, Minus, Plus, X } from 'lucide-react-native';
import { EventDetailSheet } from './EventDetailSheet';
import type { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import type { FeatureCollection } from 'geojson';
import { INDIA_BOUNDARY } from '../data/india-boundary';
import { SEVERITY_COLORS } from '../lib/constants';
import type { ThreatEvent } from '../api/types';
import { useColors, useTheme } from '../theme/ThemeProvider';
import type { Palette } from '../theme/palettes';

// Same tiles as the website (CartoDB dark_all / light_all). Raster, no API key.
function makeMapStyle(isDark: boolean, bg: string): StyleSpecification {
  const variant = isDark ? 'dark_all' : 'light_all';
  return {
    version: 8,
    sources: {
      carto: {
        type: 'raster',
        tiles: [
          `https://a.basemaps.cartocdn.com/${variant}/{z}/{x}/{y}.png`,
          `https://b.basemaps.cartocdn.com/${variant}/{z}/{x}/{y}.png`,
          `https://c.basemaps.cartocdn.com/${variant}/{z}/{x}/{y}.png`,
        ],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors © CARTO',
        maxzoom: 18,
      },
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': bg } },
      { id: 'carto', type: 'raster', source: 'carto', paint: { 'raster-opacity': 1 } },
    ],
  };
}

/** Great-circle arc between two points, so long attack lines curve like the web version. */
function arc(lat1: number, lng1: number, lat2: number, lng2: number, steps = 24): [number, number][] {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const φ1 = toRad(lat1), λ1 = toRad(lng1), φ2 = toRad(lat2), λ2 = toRad(lng2);
  const d = 2 * Math.asin(Math.sqrt(Math.sin((φ2 - φ1) / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2));
  if (d === 0) return [[lng1, lat1], [lng2, lat2]];
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
    const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
    const z = A * Math.sin(φ1) + B * Math.sin(φ2);
    pts.push([toDeg(Math.atan2(y, x)), toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)))]);
  }
  // Unwrap longitudes so an arc crossing the antimeridian continues past ±180 instead of snapping across the map.
  for (let i = 1; i < pts.length; i++) {
    const delta = pts[i][0] - pts[i - 1][0];
    if (delta > 180) pts[i][0] -= 360;
    else if (delta < -180) pts[i][0] += 360;
  }
  return pts;
}

function opacityFor(e: ThreatEvent, now: number): number {
  const age = now - e.timestamp;
  const maxAge = 30000;
  if (age > maxAge) return 0.15;
  return 1 - (age / maxAge) * 0.85;
}

interface Props {
  events: ThreatEvent[];
  height?: number;
  highlightedId?: string | null;
  /** Show the maximize button that opens the map full-screen. */
  expandable?: boolean;
}

const MIN_ZOOM = 0;
const MAX_ZOOM = 8;

export function ThreatMap({ events, height = 300, highlightedId, expandable = true }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [fullscreen, setFullscreen] = useState(false);
  const insets = useSafeAreaInsets();
  return (
    <>
      <MapView events={events} height={height} highlightedId={highlightedId} onMaximize={expandable ? () => setFullscreen(true) : undefined} />
      <Modal visible={fullscreen} animationType="fade" onRequestClose={() => setFullscreen(false)} statusBarTranslucent>
        <View style={[styles.full, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <MapView events={events} height={-1} highlightedId={highlightedId} rounded={false} onClose={() => setFullscreen(false)} />
        </View>
      </Modal>
    </>
  );
}

function MapView({
  events,
  height,
  highlightedId,
  onMaximize,
  onClose,
  rounded = true,
}: {
  events: ThreatEvent[];
  height: number;
  highlightedId?: string | null;
  onMaximize?: () => void;
  onClose?: () => void;
  rounded?: boolean;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { isDark } = useTheme();
  const cameraRef = useRef<CameraRef>(null);
  const mapRef = useRef<MapRef>(null);
  const [selected, setSelected] = useState<ThreatEvent | null>(null);
  const mapStyle = useMemo(() => makeMapStyle(isDark, colors.bg), [isDark, colors.bg]);

  /** Nearest event endpoint to a tapped coordinate, within ~24 px at the current zoom. */
  const pickNearest = async (lng: number, lat: number): Promise<ThreatEvent | null> => {
    const zoom = (await mapRef.current?.getZoom().catch(() => null)) ?? 0;
    const degPerPx = 360 / (512 * 2 ** zoom);
    const threshold = degPerPx * 24;
    let best: { e: ThreatEvent; d: number } | null = null;
    for (const e of events) {
      for (const [x, y] of [[e.sourceLng, e.sourceLat], [e.targetLng, e.targetLat]]) {
        const dx = Math.abs(((x - lng + 540) % 360) - 180);
        const dy = y - lat;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d <= threshold && (!best || d < best.d)) best = { e, d };
      }
    }
    return best?.e ?? null;
  };

  const zoomBy = async (delta: number) => {
    const current = (await mapRef.current?.getZoom().catch(() => null)) ?? 0;
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current + delta));
    cameraRef.current?.zoomTo(next, { duration: 250 });
  };

  const { lines, points } = useMemo(() => {
    const now = Date.now();
    const lines: FeatureCollection = {
      type: 'FeatureCollection',
      features: events.map((e) => ({
        type: 'Feature',
        id: e.id,
        properties: {
          color: SEVERITY_COLORS[e.severity],
          opacity: e.id === highlightedId ? 1 : opacityFor(e, now),
          width: e.id === highlightedId ? 2.5 : e.severity === 'critical' ? 1.8 : 1.2,
        },
        geometry: { type: 'LineString', coordinates: arc(e.sourceLat, e.sourceLng, e.targetLat, e.targetLng) },
      })),
    };
    const points: FeatureCollection = {
      type: 'FeatureCollection',
      features: events.flatMap((e) => {
        const op = e.id === highlightedId ? 1 : opacityFor(e, now);
        return [
          {
            type: 'Feature' as const,
            properties: { id: e.id, color: SEVERITY_COLORS[e.severity], opacity: op, radius: 4 },
            geometry: { type: 'Point' as const, coordinates: [e.sourceLng, e.sourceLat] },
          },
          {
            type: 'Feature' as const,
            properties: { id: e.id, color: colors.accent, opacity: op, radius: 3 },
            geometry: { type: 'Point' as const, coordinates: [e.targetLng, e.targetLat] },
          },
        ];
      }),
    };
    return { lines, points };
  }, [events, highlightedId, colors.accent]);

  return (
    <View style={[styles.wrap, height > 0 ? { height } : styles.fill, !rounded && { borderRadius: 0 }]}>
      <MapLibreMap
        ref={mapRef}
        style={styles.map}
        mapStyle={mapStyle}
        attribution={false}
        logo={false}
        touchRotate={false}
        touchPitch={false}
        touchZoom
        doubleTapZoom
        onPress={async (e) => {
          const withFeatures = e.nativeEvent as { features?: GeoJSON.Feature[]; lngLat: [number, number] | { lng: number; lat: number } };
          const id = withFeatures.features?.[0]?.properties?.id;
          const byFeature = typeof id === 'string' ? events.find((x) => x.id === id) : undefined;
          if (byFeature) return setSelected(byFeature);
          const ll = withFeatures.lngLat;
          const [lng, lat] = Array.isArray(ll) ? ll : [ll.lng, ll.lat];
          const near = await pickNearest(lng, lat);
          if (near) setSelected(near);
        }}
      >
        <Camera ref={cameraRef} initialViewState={{ center: [15, 25], zoom: 0 }} minZoom={MIN_ZOOM} maxZoom={MAX_ZOOM} />

        {/* India boundary from Survey of India data, styled to match the tiles (same as website). */}
        <GeoJSONSource id="india-boundary" data={INDIA_BOUNDARY}>
          <Layer
            id="india-boundary-line"
            type="line"
            paint={{ 'line-color': isDark ? '#4a4a4a' : '#9aa3b2', 'line-width': 0.8, 'line-opacity': 0.6 }}
          />
        </GeoJSONSource>

        <GeoJSONSource id="attack-lines" data={lines}>
          <Layer
            id="attack-lines-layer"
            type="line"
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{
              'line-color': ['get', 'color'],
              'line-opacity': ['get', 'opacity'],
              'line-width': ['get', 'width'],
            }}
          />
        </GeoJSONSource>

        <GeoJSONSource
          id="attack-points"
          data={points}
          hitbox={{ top: 16, bottom: 16, left: 16, right: 16 }}
          onPress={(e) => {
            const id = e.nativeEvent.features?.[0]?.properties?.id;
            const ev = typeof id === 'string' ? events.find((x) => x.id === id) : undefined;
            if (ev) setSelected(ev);
          }}
        >
          <Layer
            id="attack-points-glow"
            type="circle"
            paint={{
              'circle-color': ['get', 'color'],
              'circle-opacity': ['*', ['get', 'opacity'], 0.25],
              'circle-radius': ['*', ['get', 'radius'], 2.5],
            }}
          />
          <Layer
            id="attack-points-core"
            type="circle"
            paint={{
              'circle-color': ['get', 'color'],
              'circle-opacity': ['get', 'opacity'],
              'circle-radius': ['get', 'radius'],
            }}
          />
        </GeoJSONSource>
      </MapLibreMap>

      {onClose ? (
        <View style={styles.topLeft}>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
            <X size={20} color={colors.text} />
          </Pressable>
          <Text style={styles.fullTitle}>LIVE THREAT MAP · simulated</Text>
        </View>
      ) : null}
      <EventDetailSheet event={selected} onClose={() => setSelected(null)} />
      <View style={styles.controls}>
        {onMaximize ? (
          <Pressable onPress={onMaximize} style={styles.ctrlBtn} hitSlop={6}>
            <Maximize2 size={16} color={colors.text} />
          </Pressable>
        ) : null}
        <Pressable onPress={() => zoomBy(1)} style={styles.ctrlBtn} hitSlop={6}>
          <Plus size={16} color={colors.text} />
        </Pressable>
        <Pressable onPress={() => zoomBy(-1)} style={styles.ctrlBtn} hitSlop={6}>
          <Minus size={16} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  wrap: { width: '100%', backgroundColor: c.bg, overflow: 'hidden', borderRadius: 12 },
  fill: { flex: 1 },
  map: { flex: 1 },
  controls: { position: 'absolute', right: 8, top: 8, gap: 6 },
  ctrlBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: `${c.surface}d9`,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  full: { flex: 1, backgroundColor: c.bg },
  topLeft: { position: 'absolute', left: 12, top: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${c.surface}d9`,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullTitle: { color: c.subtle, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
});
