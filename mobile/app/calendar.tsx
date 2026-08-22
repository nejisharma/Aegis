import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Screen } from '../src/components/Screen';
import { Card, Pill, SectionHeader, SeverityDot } from '../src/components/ui';
import { generatePatchDates, patchDatesInMonth, type PatchDate } from '../src/lib/patch-dates';
import { shortDate } from '../src/lib/format';
import { useColors } from '../src/theme/ThemeProvider';
import type { Palette } from '../src/theme/palettes';
import { radius, spacing } from '../src/theme/spacing';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function vendorColor(vendors: string[], c: Palette): string {
  return vendors.includes('Oracle') ? c.high : c.accent;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function CalendarScreen() {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const shift = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const marks = useMemo(() => patchDatesInMonth(year, month), [year, month]);
  const upcoming = useMemo(() => generatePatchDates(today), [today]);

  const cells = useMemo(() => {
    const first = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const out: (number | null)[] = Array.from({ length: first }, () => null);
    for (let d = 1; d <= days; d++) out.push(d);
    while (out.length % 7) out.push(null);
    return out;
  }, [year, month]);

  const monthLabel = new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <Screen scroll title="Patch Calendar">
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <Card>
          <View style={s.nav}>
            <Pressable onPress={() => shift(-1)} hitSlop={10} style={s.navBtn}>
              <ChevronLeft size={20} color={colors.accent} />
            </Pressable>
            <Pressable onPress={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}>
              <Text style={s.month}>{monthLabel}</Text>
            </Pressable>
            <Pressable onPress={() => shift(1)} hitSlop={10} style={s.navBtn}>
              <ChevronRight size={20} color={colors.accent} />
            </Pressable>
          </View>
          <View style={s.grid}>
            {WEEKDAYS.map((w, i) => (
              <View key={`h${i}`} style={s.cell}>
                <Text style={s.weekday}>{w}</Text>
              </View>
            ))}
            {cells.map((day, i) => {
              if (day === null) return <View key={`e${i}`} style={s.cell} />;
              const date = new Date(year, month, day);
              const isToday = sameDay(date, today);
              const mark = marks.filter((m) => sameDay(m.date, date));
              return (
                <View key={`d${day}`} style={s.cell}>
                  <View style={[s.day, isToday && s.today]}>
                    <Text style={[s.dayText, isToday && s.todayText, !mark.length && date < today && s.pastText]}>{day}</Text>
                  </View>
                  <View style={s.dots}>
                    {mark.map((m) => (
                      <SeverityDot key={m.label} color={vendorColor(m.vendors, colors)} size={5} />
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
          <View style={s.legend}>
            <SeverityDot color={colors.accent} size={6} />
            <Text style={s.legendText}>Microsoft / Adobe</Text>
            <SeverityDot color={colors.high} size={6} />
            <Text style={s.legendText}>Oracle CPU</Text>
          </View>
        </Card>

        {marks.length ? (
          <View style={{ gap: spacing.sm }}>
            {marks.map((m) => (
              <PatchRow key={`${m.label}-${m.date.getTime()}`} item={m} />
            ))}
          </View>
        ) : null}
      </View>

      <SectionHeader title="Upcoming" />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xl }}>
        {upcoming.map((m) => (
          <PatchRow key={`${m.label}-${m.date.getTime()}`} item={m} />
        ))}
      </View>
    </Screen>
  );
}

function PatchRow({ item }: { item: PatchDate }) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const color = vendorColor(item.vendors, colors);
  return (
    <View style={[s.patchRow, item.isPast && s.patchPast, item.isNext && { borderColor: color }]}>
      <SeverityDot color={item.isPast ? colors.muted : color} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[s.patchLabel, item.isPast && s.pastText]}>{item.label}</Text>
        <Text style={s.patchMeta}>
          {item.vendors.join(', ')} · {shortDate(item.date)}
        </Text>
      </View>
      {item.isNext ? <Pill label="Next" color={color} /> : null}
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  navBtn: { padding: 4 },
  month: { color: c.text, fontSize: 15, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  weekday: { color: c.muted, fontSize: 10, fontWeight: '700' },
  day: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  today: { backgroundColor: c.accentDim, borderWidth: 1, borderColor: c.accent },
  dayText: { color: c.text, fontSize: 13, fontVariant: ['tabular-nums'] },
  todayText: { color: c.accent, fontWeight: '700' },
  pastText: { color: c.muted },
  dots: { flexDirection: 'row', gap: 3, height: 6, marginTop: 2 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm, justifyContent: 'center' },
  legendText: { color: c.muted, fontSize: 11, marginRight: spacing.sm },
  patchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: c.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  patchPast: { opacity: 0.6 },
  patchLabel: { color: c.text, fontSize: 14, fontWeight: '600' },
  patchMeta: { color: c.muted, fontSize: 12 },
});
