import { useMemo, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { donutArcs } from '../lib/analytics';
import { useColors } from '../theme/ThemeProvider';
import type { Palette } from '../theme/palettes';
import { radius, spacing } from '../theme/spacing';

/* Dependency-free, theme-aware charts on react-native-svg. Each chart measures its own width via
   onLayout so it fills whatever card it sits in; heights are fixed by prop. */

export interface ChartDatum {
  label: string;
  value: number;
  color: string;
  /** Optional text rendered before the label (HBarChart only — e.g. a flag emoji). */
  prefix?: string;
}

const defaultFormat = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

/** Track the width of the wrapping View so SVG charts can fill the card. */
function useMeasuredWidth(): [number, (e: LayoutChangeEvent) => void] {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w !== width) setWidth(w);
  };
  return [width, onLayout];
}

// ------------------------------------------------------------------ VBarChart

export function VBarChart({
  data,
  height = 200,
  valueFormatter = defaultFormat,
}: {
  data: ChartDatum[];
  height?: number;
  valueFormatter?: (v: number) => string;
}) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const [width, onLayout] = useMeasuredWidth();

  const labelBand = 34;
  const valueBand = 16;
  const plotTop = valueBand;
  const plotBottom = height - labelBand;
  const plotH = Math.max(1, plotBottom - plotTop);
  const max = Math.max(1, ...data.map((d) => d.value));
  const n = Math.max(1, data.length);
  const slot = width / n;
  const barW = Math.max(8, Math.min(40, slot * 0.6));
  const ticks = [0.25, 0.5, 0.75, 1];

  return (
    <View onLayout={onLayout} style={{ width: '100%' }}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          {ticks.map((t) => {
            const y = plotBottom - plotH * t;
            return <Line key={t} x1={0} x2={width} y1={y} y2={y} stroke={colors.border} strokeWidth={1} strokeDasharray="3 3" />;
          })}
          <Line x1={0} x2={width} y1={plotBottom} y2={plotBottom} stroke={colors.border} strokeWidth={1} />
          {data.map((d, i) => {
            const h = (Math.max(0, d.value) / max) * plotH;
            const x = slot * i + (slot - barW) / 2;
            const y = plotBottom - h;
            const r = Math.min(4, barW / 2, h / 2);
            // Rounded top only: arc the two top corners, square bottom.
            const path =
              h > 0
                ? `M${x},${plotBottom} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + barW - r},${y} Q${x + barW},${y} ${x + barW},${y + r} L${x + barW},${plotBottom} Z`
                : '';
            return path ? <Path key={d.label + i} d={path} fill={d.color} /> : null;
          })}
          {data.map((d, i) => {
            const h = (Math.max(0, d.value) / max) * plotH;
            const cx = slot * i + slot / 2;
            return (
              <SvgText key={`v${i}`} x={cx} y={plotBottom - h - 4} fontSize={10} fill={colors.subtle} textAnchor="middle" fontWeight="600">
                {valueFormatter(d.value)}
              </SvgText>
            );
          })}
        </Svg>
      ) : null}
      {width > 0 ? (
        <View style={[s.xLabels, { top: plotBottom + 4 }]} pointerEvents="none">
          {data.map((d, i) => (
            <View key={`l${i}`} style={{ width: slot, paddingHorizontal: 2 }}>
              <Text style={s.xLabel} numberOfLines={2}>
                {d.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

// ------------------------------------------------------------------ HBarChart

export function HBarChart({
  data,
  height,
  valueFormatter = defaultFormat,
}: {
  data: ChartDatum[];
  /** Optional fixed height; defaults to rows × row height. */
  height?: number;
  valueFormatter?: (v: number) => string;
}) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const [width, onLayout] = useMeasuredWidth();
  const max = Math.max(1, ...data.map((d) => d.value));
  const rowH = height ? height / Math.max(1, data.length) : 24;
  const barH = Math.min(14, rowH * 0.6);

  return (
    <View style={{ gap: 0 }}>
      {data.map((d, i) => (
        <View key={d.label + i} style={[s.hRow, { height: rowH }]}>
          <Text style={s.hLabel} numberOfLines={1}>
            {d.prefix ? `${d.prefix} ` : ''}
            {d.label}
          </Text>
          <View style={{ flex: 1 }} onLayout={i === 0 ? onLayout : undefined}>
            {width > 0 ? (
              <Svg width={width} height={barH}>
                <Rect x={0} y={0} width={width} height={barH} rx={3} fill={colors.surfaceAlt} />
                <Rect x={0} y={0} width={Math.max(3, (Math.max(0, d.value) / max) * width)} height={barH} rx={3} fill={d.color} />
              </Svg>
            ) : null}
          </View>
          <Text style={[s.hValue, { color: d.color }]}>{valueFormatter(d.value)}</Text>
        </View>
      ))}
    </View>
  );
}

// ------------------------------------------------------------------ Donut

function polar(cx: number, cy: number, r: number, deg: number) {
  // 0° = 12 o'clock, clockwise.
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, outer: number, inner: number, start: number, end: number) {
  const sweep = end - start;
  if (sweep <= 0) return '';
  if (sweep >= 359.999) {
    // Full ring: two half-arcs so the path does not collapse.
    const o1 = polar(cx, cy, outer, 0);
    const o2 = polar(cx, cy, outer, 180);
    const i1 = polar(cx, cy, inner, 0);
    const i2 = polar(cx, cy, inner, 180);
    return [
      `M${o1.x},${o1.y} A${outer},${outer} 0 1 1 ${o2.x},${o2.y} A${outer},${outer} 0 1 1 ${o1.x},${o1.y}`,
      `M${i1.x},${i1.y} A${inner},${inner} 0 1 0 ${i2.x},${i2.y} A${inner},${inner} 0 1 0 ${i1.x},${i1.y}`,
      'Z',
    ].join(' ');
  }
  const large = sweep > 180 ? 1 : 0;
  const os = polar(cx, cy, outer, start);
  const oe = polar(cx, cy, outer, end);
  const is = polar(cx, cy, inner, start);
  const ie = polar(cx, cy, inner, end);
  return `M${os.x},${os.y} A${outer},${outer} 0 ${large} 1 ${oe.x},${oe.y} L${ie.x},${ie.y} A${inner},${inner} 0 ${large} 0 ${is.x},${is.y} Z`;
}

export function Donut({
  data,
  size = 180,
  centerLabel,
  centerSub,
}: {
  data: ChartDatum[];
  size?: number;
  centerLabel?: string;
  centerSub?: string;
}) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const arcs = useMemo(() => donutArcs(data.map((d) => d.value)), [data]);
  const total = data.reduce((sum, d) => sum + Math.max(0, d.value), 0);
  const cx = size / 2;
  const cy = size / 2;
  const outer = size / 2 - 2;
  const inner = outer * 0.66;
  const gap = arcs.filter((a) => a.pct > 0).length > 1 ? 3 : 0; // degrees of padding like the web paddingAngle

  return (
    <View style={{ alignItems: 'center', gap: spacing.md }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {total === 0 ? <Circle cx={cx} cy={cy} r={(outer + inner) / 2} stroke={colors.surfaceAlt} strokeWidth={outer - inner} fill="none" /> : null}
          {arcs.map((a, i) => {
            if (a.pct <= 0) return null;
            const start = a.startAngle + gap / 2;
            const end = Math.max(start, a.endAngle - gap / 2);
            return <Path key={i} d={arcPath(cx, cy, outer, inner, start, end)} fill={data[i].color} />;
          })}
        </Svg>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={s.donutCenter}>
            {centerLabel !== undefined ? <Text style={s.donutValue}>{centerLabel}</Text> : null}
            {centerSub ? <Text style={s.donutSub}>{centerSub}</Text> : null}
          </View>
        </View>
      </View>
      <View style={s.legend}>
        {data.map((d, i) => (
          <View key={d.label + i} style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: d.color }]} />
            <Text style={s.legendText} numberOfLines={1}>
              {d.label} <Text style={s.legendValue}>{defaultFormat(d.value)}</Text>
              <Text style={s.legendPct}> ({Math.round(arcs[i].pct * 100)}%)</Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ------------------------------------------------------------------ Radar

export function Radar({
  axes,
  size = 240,
  color,
  max = 100,
}: {
  axes: { label: string; value: number }[];
  size?: number;
  color: string;
  max?: number;
}) {
  const colors = useColors();
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 34; // leave room for the labels
  const n = Math.max(1, axes.length);
  const angle = (i: number) => (360 / n) * i;
  const rings = [0.25, 0.5, 0.75, 1];

  const ringPoints = (f: number) =>
    axes
      .map((_, i) => {
        const p = polar(cx, cy, r * f, angle(i));
        return `${p.x},${p.y}`;
      })
      .join(' ');
  const polygon = axes
    .map((a, i) => {
      const v = Math.max(0, Math.min(1, a.value / max));
      const p = polar(cx, cy, r * v, angle(i));
      return `${p.x},${p.y}`;
    })
    .join(' ');

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        {rings.map((f) => (
          <Polygon key={f} points={ringPoints(f)} stroke={colors.border} strokeWidth={1} fill="none" />
        ))}
        {axes.map((_, i) => {
          const p = polar(cx, cy, r, angle(i));
          return <Line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={colors.border} strokeWidth={1} />;
        })}
        {axes.length ? <Polygon points={polygon} fill={color} fillOpacity={0.25} stroke={color} strokeWidth={2} /> : null}
        {axes.map((a, i) => {
          const v = Math.max(0, Math.min(1, a.value / max));
          const p = polar(cx, cy, r * v, angle(i));
          return <Circle key={`p${i}`} cx={p.x} cy={p.y} r={2.5} fill={color} />;
        })}
        {axes.map((a, i) => {
          const p = polar(cx, cy, r + 14, angle(i));
          const dx = p.x - cx;
          const anchor = Math.abs(dx) < 6 ? 'middle' : dx > 0 ? 'start' : 'end';
          return (
            <SvgText key={`t${i}`} x={p.x} y={p.y + 4} fontSize={11} fill={colors.subtle} textAnchor={anchor}>
              {a.label}
            </SvgText>
          );
        })}
        {rings.map((f) => (
          <SvgText key={`r${f}`} x={cx + 3} y={cy - r * f + 3} fontSize={8} fill={colors.muted}>
            {Math.round(max * f)}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

// ------------------------------------------------------------------ styles

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    xLabels: { position: 'absolute', left: 0, right: 0, flexDirection: 'row' },
    xLabel: { color: c.subtle, fontSize: 10, textAlign: 'center', lineHeight: 13 },
    hRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    hLabel: { color: c.subtle, fontSize: 12, width: 128 },
    hValue: { fontSize: 11, fontWeight: '600', minWidth: 30, textAlign: 'right', fontVariant: ['tabular-nums'] },
    donutCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    donutValue: { color: c.text, fontSize: 24, fontWeight: '700' },
    donutSub: { color: c.muted, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
    legend: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' },
    legendItem: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 3, paddingRight: spacing.sm },
    legendDot: { width: 8, height: 8, borderRadius: radius.sm },
    legendText: { color: c.subtle, fontSize: 12, flex: 1 },
    legendValue: { color: c.text, fontWeight: '600' },
    legendPct: { color: c.muted },
  });
