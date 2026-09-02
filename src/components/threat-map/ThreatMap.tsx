'use client';

import { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  GeoJSON,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSimulatedThreats } from '@/hooks/useSimulatedThreats';
import { useDashboardStore } from '@/store/dashboard-store';
import { SEVERITY_COLORS } from '@/lib/constants';
import { MapControls } from './MapControls';
import type { ThreatEvent } from '@/types/threat-event';

const MAX_VISIBLE_EVENTS = 50;

// CartoDB dark_all — dark tiles with country labels visible.
// CARTO raster basemaps require an API key since 2026 (carto.com/basemaps/apikey);
// without NEXT_PUBLIC_CARTO_KEY the tiles render with an "API KEY REQUIRED" watermark.
const CARTO_KEY = process.env.NEXT_PUBLIC_CARTO_KEY;
const TILE_URL = `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png${
  CARTO_KEY ? `?key=${CARTO_KEY}` : ''
}`;
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

// Style for the India SOI boundary overlay
// Match the default CartoDB dark tile border color so it blends in naturally
const INDIA_BOUNDARY_STYLE: L.PathOptions = {
  color: '#4a4a4a',
  weight: 0.8,
  opacity: 0.6,
  fillOpacity: 0,
  dashArray: undefined,
};

function createPulsingIcon(color: string, isSource: boolean): L.DivIcon {
  const size = isSource ? 10 : 8;
  const pulseSize = isSource ? 24 : 18;
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:${pulseSize}px;height:${pulseSize}px;display:flex;align-items:center;justify-content:center;">
        <div style="
          position:absolute;
          width:${pulseSize}px;
          height:${pulseSize}px;
          border-radius:50%;
          background:${color};
          opacity:0.3;
          animation:pulse-ring 1.5s ease-out infinite;
        "></div>
        <div style="
          width:${size}px;
          height:${size}px;
          border-radius:50%;
          background:${color};
          box-shadow:0 0 10px ${color}, 0 0 20px ${color};
          position:relative;
          z-index:2;
        "></div>
      </div>
      <style>
        @keyframes pulse-ring {
          0% { transform: scale(0.5); opacity: 0.4; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      </style>
    `,
    iconSize: [pulseSize, pulseSize],
    iconAnchor: [pulseSize / 2, pulseSize / 2],
  });
}

function computeCurvedPath(
  sourceLat: number,
  sourceLng: number,
  targetLat: number,
  targetLng: number
): [number, number][] {
  const midLat = (sourceLat + targetLat) / 2;
  const midLng = (sourceLng + targetLng) / 2;
  const dLat = Math.abs(sourceLat - targetLat);
  const dLng = Math.abs(sourceLng - targetLng);
  const dist = Math.sqrt(dLat * dLat + dLng * dLng);
  const arcHeight = dist * 0.2;

  const points: [number, number][] = [];
  const segments = 20;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const lat =
      (1 - t) * (1 - t) * sourceLat +
      2 * (1 - t) * t * (midLat + arcHeight) +
      t * t * targetLat;
    const lng =
      (1 - t) * (1 - t) * sourceLng +
      2 * (1 - t) * t * midLng +
      t * t * targetLng;
    points.push([lat, lng]);
  }
  return points;
}

interface ThreatLineProps {
  event: ThreatEvent;
  opacity: number;
}

function ThreatLine({ event, opacity }: ThreatLineProps) {
  const color = SEVERITY_COLORS[event.severity];
  const positions = useMemo(
    () =>
      computeCurvedPath(
        event.sourceLat,
        event.sourceLng,
        event.targetLat,
        event.targetLng
      ),
    [event.sourceLat, event.sourceLng, event.targetLat, event.targetLng]
  );

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color,
        weight: 1.5,
        opacity: opacity * 0.7,
        dashArray: '6 4',
        lineCap: 'round',
      }}
    />
  );
}

function MapInvalidator() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

// Component to load and render India boundary GeoJSON
function IndiaBoundary() {
  const [geoData, setGeoData] = useState<GeoJSON.GeoJsonObject | null>(null);

  useEffect(() => {
    fetch('/data/india-boundary.geojson')
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch(() => {});
  }, []);

  if (!geoData) return null;

  return (
    <GeoJSON
      data={geoData}
      style={() => INDIA_BOUNDARY_STYLE}
    />
  );
}

export default function ThreatMap() {
  const { events, isActive, toggleActive, clearEvents } =
    useSimulatedThreats();
  const mapFilters = useDashboardStore((s) => s.mapFilters);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredEvents = useMemo(() => {
    return events
      .filter(
        (e) =>
          mapFilters.severities.has(e.severity) &&
          mapFilters.types.has(e.type)
      )
      .slice(0, MAX_VISIBLE_EVENTS);
  }, [events, mapFilters]);

  const getEventOpacity = useCallback(
    (event: ThreatEvent) => {
      const age = Date.now() - event.timestamp;
      const maxAge = 30000;
      if (age > maxAge) return 0.15;
      return 1 - (age / maxAge) * 0.85;
    },
    []
  );

  if (!mounted) {
    return (
      <div className="w-full h-full bg-[#060a13] flex items-center justify-center">
        <div className="text-slate-500 text-sm">Initializing threat map...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={8}
        zoomControl={true}
        scrollWheelZoom={true}
        className="w-full h-full"
        style={{ background: '#060a13' }}
      >
        <MapInvalidator />
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />

        {/* India boundary overlay from Survey of India data */}
        <IndiaBoundary />

        {/* Attack lines */}
        {filteredEvents.map((event) => {
          const opacity = getEventOpacity(event);
          return (
            <ThreatLine key={`line-${event.id}`} event={event} opacity={opacity} />
          );
        })}

        {/* Source markers with popups */}
        {filteredEvents.map((event) => {
          const color = SEVERITY_COLORS[event.severity];
          const opacity = getEventOpacity(event);
          const timeAgo = Math.floor((Date.now() - event.timestamp) / 1000);
          const timeStr = timeAgo < 5 ? 'just now' : timeAgo < 60 ? `${timeAgo}s ago` : `${Math.floor(timeAgo / 60)}m ago`;
          return (
            <Marker
              key={`src-${event.id}`}
              position={[event.sourceLat, event.sourceLng]}
              icon={createPulsingIcon(color, true)}
              opacity={opacity}
            >
              <Popup className="threat-popup">
                <div style={{fontFamily:'Inter,system-ui,sans-serif',fontSize:'12px',color:'#e2e8f0',minWidth:'180px'}}>
                  <div style={{fontWeight:700,color,textTransform:'uppercase',fontSize:'11px',letterSpacing:'0.05em',marginBottom:'4px'}}>
                    {event.type} — {event.severity}
                  </div>
                  <div style={{fontSize:'13px',fontWeight:600,marginBottom:'6px'}}>{event.label}</div>
                  <div style={{color:'#94a3b8',fontSize:'11px',marginBottom:'2px'}}>
                    <span style={{color:'#06b6d4'}}>Source:</span> {event.sourceCountry}
                  </div>
                  <div style={{color:'#94a3b8',fontSize:'11px',marginBottom:'2px'}}>
                    <span style={{color:'#f97316'}}>Target:</span> {event.targetCountry}
                  </div>
                  <div style={{color:'#64748b',fontSize:'10px',marginTop:'4px'}}>{timeStr}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Target markers with popups */}
        {filteredEvents.map((event) => {
          const color = SEVERITY_COLORS[event.severity];
          const opacity = getEventOpacity(event);
          const timeAgo = Math.floor((Date.now() - event.timestamp) / 1000);
          const timeStr = timeAgo < 5 ? 'just now' : timeAgo < 60 ? `${timeAgo}s ago` : `${Math.floor(timeAgo / 60)}m ago`;
          return (
            <Marker
              key={`tgt-${event.id}`}
              position={[event.targetLat, event.targetLng]}
              icon={createPulsingIcon(color, false)}
              opacity={opacity}
            >
              <Popup className="threat-popup">
                <div style={{fontFamily:'Inter,system-ui,sans-serif',fontSize:'12px',color:'#e2e8f0',minWidth:'180px'}}>
                  <div style={{fontWeight:700,color,textTransform:'uppercase',fontSize:'11px',letterSpacing:'0.05em',marginBottom:'4px'}}>
                    {event.type} — {event.severity}
                  </div>
                  <div style={{fontSize:'13px',fontWeight:600,marginBottom:'6px'}}>{event.label}</div>
                  <div style={{color:'#94a3b8',fontSize:'11px',marginBottom:'2px'}}>
                    <span style={{color:'#06b6d4'}}>Source:</span> {event.sourceCountry}
                  </div>
                  <div style={{color:'#94a3b8',fontSize:'11px',marginBottom:'2px'}}>
                    <span style={{color:'#f97316'}}>Target:</span> {event.targetCountry}
                  </div>
                  <div style={{color:'#64748b',fontSize:'10px',marginTop:'4px'}}>{timeStr}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map controls overlay */}
      <MapControls
        eventCount={filteredEvents.length}
        isActive={isActive}
        onToggleActive={toggleActive}
        onClear={clearEvents}
      />

      {/* Legend (bottom-left) - hidden on mobile */}
      <div className="hidden sm:block absolute bottom-4 left-4 z-[1000] bg-[#0d1528]/90 backdrop-blur-md border border-[#1a2744] rounded-lg p-3">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
          Severity
        </p>
        <div className="space-y-1.5">
          {(
            Object.entries(SEVERITY_COLORS) as [string, string][]
          ).map(([label, color]) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: color,
                  boxShadow: `0 0 6px ${color}`,
                }}
              />
              <span className="text-[11px] text-slate-400 capitalize">
                {label}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[9px] text-slate-600 mt-2 border-t border-slate-700/50 pt-1.5">
          Simulated Intelligence Feed
        </p>
      </div>
    </div>
  );
}
