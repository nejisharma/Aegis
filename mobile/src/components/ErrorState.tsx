import { useEffect, useState, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { ApiError } from '../api/client';
import { classifyFailure, type FailureKind } from '../lib/connectivity';
import { useColors } from '../theme/ThemeProvider';
import type { Palette } from '../theme/palettes';
import { radius, spacing } from '../theme/spacing';

const COPY: Record<FailureKind, { title: string; message: string }> = {
  network: {
    title: 'No internet connection',
    message: 'Your device seems to be offline. The threat landscape will wait — check Wi-Fi or mobile data and try again.',
  },
  maintenance: {
    title: 'Aegis servers are under maintenance',
    message: 'Our servers are taking a short nap. Your connection is fine — we are patching things on our end. Try again in a minute.',
  },
  upstream: {
    title: 'Source temporarily unavailable',
    message: 'Aegis is up, but the upstream data provider for this panel did not answer. Try again shortly.',
  },
  unknown: {
    title: 'Nothing came back',
    message: 'The data source could not answer this request. Try a different query or try again.',
  },
};

interface Props {
  error: unknown;
  onRetry?: () => void;
  /** Extra detail shown under the message (e.g. the raw error text). */
  detail?: string;
}

/** Full error panel: figures out whether it is the user's network or our server, and shows a matching illustration. */
export function ErrorState({ error, onRetry, detail }: Props) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const [kind, setKind] = useState<FailureKind | null>(null);

  useEffect(() => {
    let alive = true;
    classifyFailure(error).then((k) => {
      if (alive) setKind(k);
    });
    return () => {
      alive = false;
    };
  }, [error]);

  const k = kind ?? (error instanceof ApiError && error.status === 0 ? 'network' : 'unknown');
  const copy = COPY[k];

  return (
    <View style={s.wrap}>
      {k === 'network' ? <NoSignalArt /> : k === 'maintenance' ? <SleepingServerArt /> : <ShrugArt />}
      <Text style={s.title}>{copy.title}</Text>
      <Text style={s.message}>{copy.message}</Text>
      {detail ? <Text style={s.detail}>{detail}</Text> : null}
      {onRetry ? (
        <Pressable onPress={onRetry} style={s.retry}>
          <Text style={s.retryText}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** A server rack fast asleep, with a hard hat and "zzz". */
function SleepingServerArt() {
  const colors = useColors();
  return (
    <Svg width={160} height={130} viewBox="0 0 160 130">
      {/* rack */}
      <Rect x={40} y={30} width={80} height={90} rx={8} fill={colors.surfaceAlt} stroke={colors.border} strokeWidth={2} />
      {[44, 66, 88].map((y) => (
        <Rect key={y} x={48} y={y} width={64} height={16} rx={3} fill={colors.surface} stroke={colors.border} />
      ))}
      {[44, 66, 88].map((y, i) => (
        <Circle key={`led-${y}`} cx={104} cy={y + 8} r={3} fill={i === 1 ? colors.medium : colors.muted} />
      ))}
      {[44, 66, 88].map((y) => (
        <Line key={`slot-${y}`} x1={54} y1={y + 8} x2={90} y2={y + 8} stroke={colors.border} strokeWidth={2} strokeLinecap="round" />
      ))}
      {/* closed eyes */}
      <Path d="M62 104 q5 4 10 0" stroke={colors.subtle} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d="M86 104 q5 4 10 0" stroke={colors.subtle} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d="M74 112 q6 3 12 0" stroke={colors.subtle} strokeWidth={2} fill="none" strokeLinecap="round" />
      {/* hard hat */}
      <Path d="M46 30 q34 -30 68 0 z" fill={colors.medium} />
      <Rect x={40} y={27} width={80} height={6} rx={3} fill={colors.high} />
      {/* zzz */}
      <SvgText x={122} y={40} fill={colors.accent} fontSize={14} fontWeight="700">z</SvgText>
      <SvgText x={132} y={28} fill={colors.accent} fontSize={18} fontWeight="700">z</SvgText>
      <SvgText x={144} y={14} fill={colors.accent} fontSize={22} fontWeight="700">z</SvgText>
      {/* wrench */}
      <Path d="M14 96 l18 -18" stroke={colors.subtle} strokeWidth={5} strokeLinecap="round" />
      <Circle cx={12} cy={98} r={7} fill="none" stroke={colors.subtle} strokeWidth={4} />
      <Circle cx={34} cy={76} r={5} fill={colors.surfaceAlt} stroke={colors.subtle} strokeWidth={3} />
    </Svg>
  );
}

/** A phone holding a bare cable with a puzzled face and a crossed-out wifi. */
function NoSignalArt() {
  const colors = useColors();
  return (
    <Svg width={160} height={130} viewBox="0 0 160 130">
      {/* wifi arcs */}
      <Path d="M50 50 q30 -28 60 0" stroke={colors.muted} strokeWidth={4} fill="none" strokeLinecap="round" />
      <Path d="M62 62 q18 -16 36 0" stroke={colors.muted} strokeWidth={4} fill="none" strokeLinecap="round" />
      <Circle cx={80} cy={74} r={4} fill={colors.muted} />
      {/* big cross */}
      <Line x1={46} y1={30} x2={114} y2={84} stroke={colors.critical} strokeWidth={5} strokeLinecap="round" />
      <Line x1={114} y1={30} x2={46} y2={84} stroke={colors.critical} strokeWidth={5} strokeLinecap="round" />
      {/* unplugged cable */}
      <Path d="M10 118 C 40 118, 40 96, 66 100" stroke={colors.accent} strokeWidth={4} fill="none" strokeLinecap="round" />
      <Rect x={64} y={94} width={14} height={12} rx={2} fill={colors.accent} />
      <Path d="M150 118 C 120 118, 120 96, 96 100" stroke={colors.accent} strokeWidth={4} fill="none" strokeLinecap="round" />
      <Rect x={84} y={94} width={14} height={12} rx={2} fill={colors.accent} />
      {/* sparks */}
      <Line x1={81} y1={88} x2={81} y2={82} stroke={colors.medium} strokeWidth={2} strokeLinecap="round" />
      <Line x1={76} y1={90} x2={72} y2={86} stroke={colors.medium} strokeWidth={2} strokeLinecap="round" />
      <Line x1={86} y1={90} x2={90} y2={86} stroke={colors.medium} strokeWidth={2} strokeLinecap="round" />
      {/* sad cloud */}
      <Ellipse cx={130} cy={20} rx={18} ry={10} fill={colors.surfaceAlt} stroke={colors.border} />
      <Circle cx={124} cy={19} r={1.8} fill={colors.subtle} />
      <Circle cx={136} cy={19} r={1.8} fill={colors.subtle} />
      <Path d="M125 26 q5 -4 10 0" stroke={colors.subtle} strokeWidth={1.5} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

/** A shrugging shield — something else went wrong. */
function ShrugArt() {
  const colors = useColors();
  return (
    <Svg width={160} height={130} viewBox="0 0 160 130">
      <Path d="M80 12 L118 26 V62 C118 90 96 108 80 116 C64 108 42 90 42 62 V26 Z" fill={colors.surfaceAlt} stroke={colors.accent} strokeWidth={3} />
      <Circle cx={68} cy={56} r={3} fill={colors.subtle} />
      <Circle cx={92} cy={56} r={3} fill={colors.subtle} />
      <Path d="M68 78 q12 -6 24 0" stroke={colors.subtle} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <SvgText x={124} y={40} fill={colors.subtle} fontSize={22}>?</SvgText>
      <Path d="M30 70 q-10 -10 0 -20" stroke={colors.subtle} strokeWidth={3} fill="none" strokeLinecap="round" />
      <Path d="M130 70 q10 -10 0 -20" stroke={colors.subtle} strokeWidth={3} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  title: { color: c.text, fontSize: 16, fontWeight: '700', textAlign: 'center', marginTop: spacing.sm },
  message: { color: c.subtle, fontSize: 13, textAlign: 'center', lineHeight: 19, maxWidth: 320 },
  detail: { color: c.muted, fontSize: 11, textAlign: 'center' },
  retry: { marginTop: spacing.sm, paddingHorizontal: 18, paddingVertical: 9, borderRadius: radius.md, borderWidth: 1, borderColor: c.accent },
  retryText: { color: c.accent, fontWeight: '700' },
});
