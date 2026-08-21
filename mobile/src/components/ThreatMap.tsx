import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Camera, GeoJSONSource, Layer, Map as MapLibreMap } from '@maplibre/maplibre-react-native';
import type { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import type { FeatureCollection } from 'geojson';
import { INDIA_BOUNDARY } from '../data/india-boundary';
import { SEVERITY_COLORS } from '../lib/constants';
import type { ThreatEvent } from '../api/types';
import { colors } from '../theme/colors';

// Same tiles as the website (CartoDB dark_all). Raster, no API key.
const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors © CARTO',
      maxzoom: 18,
    },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#060a13' } },
    { id: 'carto', type: 'raster', source: 'carto', paint: { 'raster-opacity': 1 } },
  ],
};

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
}

export function ThreatMap({ events, height = 300, highlightedId }: Props) {
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
            properties: { color: SEVERITY_COLORS[e.severity], opacity: op, radius: 4 },
            geometry: { type: 'Point' as const, coordinates: [e.sourceLng, e.sourceLat] },
          },
          {
            type: 'Feature' as const,
            properties: { color: colors.accent, opacity: op, radius: 3 },
            geometry: { type: 'Point' as const, coordinates: [e.targetLng, e.targetLat] },
          },
        ];
      }),
    };
    return { lines, points };
  }, [events, highlightedId]);

  return (
    <View style={[styles.wrap, { height }]}>
      <MapLibreMap
        style={styles.map}
        mapStyle={MAP_STYLE}
        attribution={false}
        logo={false}
        touchRotate={false}
        touchPitch={false}
      >
        <Camera initialViewState={{ center: [20, 20], zoom: 0.6 }} minZoom={0.3} maxZoom={8} />

        {/* India boundary from Survey of India data, styled to match the tiles (same as website). */}
        <GeoJSONSource id="india-boundary" data={INDIA_BOUNDARY}>
          <Layer
            id="india-boundary-line"
            type="line"
            paint={{ 'line-color': '#4a4a4a', 'line-width': 0.8, 'line-opacity': 0.6 }}
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

        <GeoJSONSource id="attack-points" data={points}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', backgroundColor: '#060a13', overflow: 'hidden', borderRadius: 12 },
  map: { flex: 1 },
});
