import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as StoreReview from 'expo-store-review';
import { DAILY_GOAL, DEFAULT_STREAK, dayKey, effectiveStreak, loadStreak, recordRound, saveStreak, type StreakState } from '../src/lib/streak';
import { Fish, Flame, Mail, MessageSquare, Link2, ShieldCheck, ShieldAlert, Trophy, RotateCcw } from 'lucide-react-native';
import { Screen } from '../src/components/Screen';
import { Pill } from '../src/components/ui';
import { PHISH_CARDS, type PhishCard, type PhishChannel } from '../src/data/phish-cards';
import { gradeFor, maxScore, pickRound, scoreAnswer, type Answer } from '../src/lib/phish-game';
import { getPref, setPref } from '../src/lib/storage';
import { useColors } from '../src/theme/ThemeProvider';
import type { Palette } from '../src/theme/palettes';
import { radius, spacing } from '../src/theme/spacing';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.28;
const SEEN_KEY = 'phish-seen';
const BEST_KEY = 'phish-best';
const REVIEW_ASKED_KEY = 'phish-review-asked';
const REVIEW_AFTER_ROUNDS = 3;

const haptic = (fn: () => Promise<void>) => fn().catch(() => {});

const CHANNEL_META: Record<PhishChannel, { label: string; Icon: typeof Mail }> = {
  email: { label: 'Email', Icon: Mail },
  sms: { label: 'SMS', Icon: MessageSquare },
  url: { label: 'Link', Icon: Link2 },
  chat: { label: 'Chat', Icon: MessageSquare },
};

const DIFF_COLOR: Record<'easy' | 'medium' | 'hard', keyof Palette> = { easy: 'success', medium: 'medium', hard: 'critical' };

type Phase = 'intro' | 'playing' | 'reveal' | 'done';

export default function PhishGameScreen() {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const [phase, setPhase] = useState<Phase>('intro');
  const [round, setRound] = useState<PhishCard[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [streakState, setStreakState] = useState<StreakState>(DEFAULT_STREAK);
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    getPref<string[]>(SEEN_KEY, []).then((ids) => {
      seenRef.current = new Set(ids);
    });
    getPref<number>(BEST_KEY, 0).then(setBest);
    loadStreak().then(setStreakState);
  }, []);

  const start = useCallback(() => {
    const next = pickRound(PHISH_CARDS, seenRef.current);
    setRound(next);
    setIndex(0);
    setAnswers([]);
    setStreak(0);
    setPhase('playing');
  }, []);

  const score = useMemo(() => answers.reduce((s, a) => s + a.points, 0), [answers]);
  const max = useMemo(() => maxScore(round), [round]);
  const current = round[index];

  const answer = useCallback(
    (saidPhish: boolean) => {
      if (!current) return;
      const a = scoreAnswer(current, saidPhish, streak);
      haptic(() => (a.correct ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)));
      setAnswers((prev) => [...prev, a]);
      setStreak(a.correct ? streak + 1 : 0);
      setPhase('reveal');
    },
    [current, streak],
  );

  const next = useCallback(() => {
    if (index + 1 >= round.length) {
      // Remember what was shown so the next 5 rounds or so avoid repeats (cap at 150 ids).
      const seen = [...seenRef.current, ...round.map((c) => c.id)].slice(-150);
      seenRef.current = new Set(seen);
      setPref(SEEN_KEY, seen);
      const finalScore = answers.reduce((s, a) => s + a.points, 0);
      if (finalScore > best) {
        setBest(finalScore);
        setPref(BEST_KEY, finalScore);
      }
      const nextStreak = recordRound(streakState, dayKey(new Date()));
      setStreakState(nextStreak);
      saveStreak(nextStreak);
      haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
      setPhase('done');
      // Ask for a store review once, after the third completed round, only if the OS supports the in-app prompt.
      if (nextStreak.totalRounds === REVIEW_AFTER_ROUNDS) {
        getPref<boolean>(REVIEW_ASKED_KEY, false).then(async (asked) => {
          if (asked) return;
          setPref(REVIEW_ASKED_KEY, true);
          if (await StoreReview.hasAction()) StoreReview.requestReview().catch(() => {});
        });
      }
    } else {
      setIndex(index + 1);
      setPhase('playing');
    }
  }, [index, round, answers, best, streakState]);

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Phish or Not?' }} />
      {phase === 'intro' ? (
        <Intro best={best} streak={streakState} onStart={start} />
      ) : phase === 'done' ? (
        <Summary answers={answers} score={score} max={max} best={best} streak={streakState} onAgain={start} />
      ) : current ? (
        <View style={s.playArea}>
          <View style={s.hud}>
            <Text style={s.hudText}>
              {index + 1} / {round.length}
            </Text>
            <Text style={[s.hudText, { color: colors.accent }]}>{score} pts</Text>
            <Text style={[s.hudText, { color: streak >= 3 ? colors.medium : colors.muted }]}>🔥 {streak}</Text>
          </View>
          <View style={s.deck}>
            <View style={phase === 'reveal' ? s.dimmed : undefined}>
              {round[index + 1] && phase === 'playing' ? <View style={s.cardShadow} /> : null}
              <SwipeCard key={`${current.id}-${phase}`} card={current} disabled={phase !== 'playing'} onSwipe={answer} />
            </View>
          </View>
          {phase === 'playing' ? (
            <View style={s.buttons}>
              <Pressable onPress={() => answer(true)} style={[s.btn, s.btnPhish]}>
                <ShieldAlert size={18} color={colors.critical} />
                <Text style={[s.btnText, { color: colors.critical }]}>← Phish</Text>
              </Pressable>
              <Pressable onPress={() => answer(false)} style={[s.btn, s.btnLegit]}>
                <ShieldCheck size={18} color={colors.success} />
                <Text style={[s.btnText, { color: colors.success }]}>Legit →</Text>
              </Pressable>
            </View>
          ) : (
            <Reveal answer={answers[answers.length - 1]} last={index + 1 >= round.length} onNext={next} />
          )}
        </View>
      ) : null}
    </Screen>
  );
}

function StreakBadge({ streak }: { streak: StreakState }) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const today = dayKey(new Date());
  const days = effectiveStreak(streak, today);
  const doneToday = streak.lastDay === today ? streak.roundsToday : 0;
  return (
    <View style={s.streakRow}>
      <View style={s.streakPill}>
        <Flame size={14} color={days > 0 ? colors.high : colors.muted} />
        <Text style={[s.streakText, days > 0 && { color: colors.high }]}>{days} day streak</Text>
      </View>
      <View style={s.streakPill}>
        <Text style={s.streakText}>
          Today {Math.min(doneToday, DAILY_GOAL)}/{DAILY_GOAL} rounds{doneToday >= DAILY_GOAL ? ' ✓' : ''}
        </Text>
      </View>
    </View>
  );
}

function Intro({ best, streak, onStart }: { best: number; streak: StreakState; onStart: () => void }) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={s.center}>
      <StreakBadge streak={streak} />
      <View style={s.heroIcon}>
        <Fish size={44} color={colors.accent} />
      </View>
      <Text style={s.h1}>Phish or Not?</Text>
      <Text style={s.lead}>
        10 real-world messages per round: 3 easy, 4 medium, 3 hard. Swipe <Text style={{ color: colors.critical, fontWeight: '700' }}>left for phish</Text>, <Text style={{ color: colors.success, fontWeight: '700' }}>right for legit</Text>. Streaks earn bonus points; every card explains its tells.
      </Text>
      {best > 0 ? (
        <Text style={s.best}>
          <Trophy size={12} color={colors.medium} /> Personal best: {best} pts
        </Text>
      ) : null}
      <Pressable onPress={onStart} style={s.startBtn}>
        <Text style={s.startText}>Start round</Text>
      </Pressable>
      <Text style={s.fine}>Brand names appear as they do in real lures. No message here links to a live site.</Text>
    </View>
  );
}

function SwipeCard({ card, disabled, onSwipe }: { card: PhishCard; disabled: boolean; onSwipe: (saidPhish: boolean) => void }) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const pan = useRef(new Animated.ValueXY()).current;
  const swiped = useRef(false);

  const finish = useCallback(
    (saidPhish: boolean) => {
      if (swiped.current) return;
      swiped.current = true;
      haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
      Animated.timing(pan, {
        toValue: { x: saidPhish ? -SCREEN_W * 1.3 : SCREEN_W * 1.3, y: 0 },
        duration: 220,
        useNativeDriver: true,
      }).start(() => onSwipe(saidPhish));
    },
    [pan, onSwipe],
  );

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => !disabled && Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
        onPanResponderRelease: (_, g) => {
          if (g.dx < -SWIPE_THRESHOLD) finish(true);
          else if (g.dx > SWIPE_THRESHOLD) finish(false);
          else Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true, friction: 6 }).start();
        },
      }),
    [disabled, pan, finish],
  );

  const rotate = pan.x.interpolate({ inputRange: [-SCREEN_W, 0, SCREEN_W], outputRange: ['-12deg', '0deg', '12deg'] });
  const phishOpacity = pan.x.interpolate({ inputRange: [-SWIPE_THRESHOLD, -20, 0], outputRange: [1, 0, 0], extrapolate: 'clamp' });
  const legitOpacity = pan.x.interpolate({ inputRange: [0, 20, SWIPE_THRESHOLD], outputRange: [0, 0, 1], extrapolate: 'clamp' });
  const { label, Icon } = CHANNEL_META[card.channel];

  return (
    <Animated.View {...responder.panHandlers} style={[s.card, { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }] }]}>
      <Animated.View style={[s.stamp, s.stampPhish, { opacity: phishOpacity }]}>
        <Text style={[s.stampText, { color: colors.critical }]}>PHISH</Text>
      </Animated.View>
      <Animated.View style={[s.stamp, s.stampLegit, { opacity: legitOpacity }]}>
        <Text style={[s.stampText, { color: colors.success }]}>LEGIT</Text>
      </Animated.View>

      <View style={s.cardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon size={14} color={colors.subtle} />
          <Text style={s.channel}>{label}</Text>
        </View>
        <Pill label={card.difficulty.toUpperCase()} color={colors[DIFF_COLOR[card.difficulty]]} />
      </View>

      <Text style={s.fromLabel}>FROM</Text>
      <Text style={s.from} selectable>
        {card.from}
      </Text>
      {card.subject ? (
        <>
          <Text style={s.fromLabel}>SUBJECT</Text>
          <Text style={s.subject}>{card.subject}</Text>
        </>
      ) : null}
      <View style={s.divider} />
      <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ paddingBottom: 4 }} nestedScrollEnabled>
        <Text style={[s.body, card.channel === 'url' && s.mono]} selectable>
          {card.body}
        </Text>
      </ScrollView>
      <Text style={s.swipeHint}>← phish · legit →</Text>
    </Animated.View>
  );
}

function Reveal({ answer, last, onNext }: { answer: Answer; last: boolean; onNext: () => void }) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const { card } = answer;
  const color = answer.correct ? colors.success : colors.critical;
  return (
    <View style={[s.reveal, { borderColor: color }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[s.revealTitle, { color }]}>
          {answer.correct ? 'Correct' : 'Missed'} · {card.isPhish ? 'This was PHISHING' : 'This was LEGIT'}
        </Text>
        <Text style={[s.revealPts, { color }]}>+{answer.points}</Text>
      </View>
      {card.tells.map((t) => (
        <Text key={t} style={s.tell}>
          • {t}
        </Text>
      ))}
      <Pressable onPress={onNext} style={s.nextBtn}>
        <Text style={s.nextText}>{last ? 'See results' : 'Next card'}</Text>
      </Pressable>
    </View>
  );
}

function Summary({ answers, score, max, best, streak, onAgain }: { answers: Answer[]; score: number; max: number; best: number; streak: StreakState; onAgain: () => void }) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const grade = gradeFor(score, max);
  const correct = answers.filter((a) => a.correct).length;
  const byDiff = (['easy', 'medium', 'hard'] as const).map((d) => {
    const subset = answers.filter((a) => a.card.difficulty === d);
    return { d, ok: subset.filter((a) => a.correct).length, n: subset.length };
  });
  return (
    <ScrollView contentContainerStyle={s.center}>
      <Trophy size={40} color={colors.medium} />
      <Text style={s.h1}>{grade.title}</Text>
      <Text style={s.lead}>{grade.blurb}</Text>
      <Text style={s.bigScore}>
        {score} <Text style={s.bigScoreMax}>/ {max} pts</Text>
      </Text>
      <Text style={s.best}>
        {correct}/{answers.length} correct{score >= best && score > 0 ? ' · new personal best!' : ` · best ${best}`}
      </Text>
      <StreakBadge streak={streak} />
      <View style={s.diffRow}>
        {byDiff.map(({ d, ok, n }) => (
          <View key={d} style={s.diffCell}>
            <Text style={[s.diffVal, { color: colors[DIFF_COLOR[d]] }]}>
              {ok}/{n}
            </Text>
            <Text style={s.diffLabel}>{d}</Text>
          </View>
        ))}
      </View>
      <View style={{ width: '100%', gap: 6 }}>
        {answers.map((a) => (
          <View key={a.card.id} style={s.reviewRow}>
            {a.correct ? <ShieldCheck size={14} color={colors.success} /> : <ShieldAlert size={14} color={colors.critical} />}
            <Text style={s.reviewText} numberOfLines={1}>
              {a.card.subject ?? a.card.body}
            </Text>
            <Text style={[s.reviewVerdict, { color: a.card.isPhish ? colors.critical : colors.success }]}>{a.card.isPhish ? 'phish' : 'legit'}</Text>
          </View>
        ))}
      </View>
      <Pressable onPress={onAgain} style={s.startBtn}>
        <RotateCcw size={16} color={colors.bg} />
        <Text style={s.startText}>Play again</Text>
      </Pressable>
    </ScrollView>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  streakRow: { flexDirection: 'row', gap: spacing.sm },
  streakPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  streakText: { color: c.subtle, fontSize: 12, fontWeight: '700' },
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  heroIcon: { width: 84, height: 84, borderRadius: 42, backgroundColor: c.accentDim, alignItems: 'center', justifyContent: 'center' },
  h1: { color: c.text, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  lead: { color: c.subtle, fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 340 },
  best: { color: c.medium, fontSize: 13, fontWeight: '600' },
  fine: { color: c.muted, fontSize: 11, textAlign: 'center', maxWidth: 320 },
  startBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.accent, paddingHorizontal: 26, paddingVertical: 12, borderRadius: radius.lg, marginTop: spacing.sm },
  startText: { color: c.bg, fontWeight: '800', fontSize: 15 },
  playArea: { flex: 1, padding: spacing.lg, gap: spacing.md },
  hud: { flexDirection: 'row', justifyContent: 'space-between' },
  hudText: { color: c.subtle, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  deck: { flex: 1, justifyContent: 'center' },
  cardShadow: { position: 'absolute', left: 12, right: 12, top: 12, bottom: -10, borderRadius: radius.lg + 4, backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border },
  dimmed: { opacity: 0.55 },
  card: {
    backgroundColor: c.surface,
    borderRadius: radius.lg + 4,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.lg,
    gap: 4,
    maxHeight: 420,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  channel: { color: c.subtle, fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  fromLabel: { color: c.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 6 },
  from: { color: c.accent, fontSize: 13, fontWeight: '600' },
  subject: { color: c.text, fontSize: 15, fontWeight: '700' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: c.border, marginVertical: spacing.sm },
  body: { color: c.text, fontSize: 14, lineHeight: 21 },
  mono: { fontFamily: 'monospace', fontSize: 13 },
  swipeHint: { color: c.muted, fontSize: 11, textAlign: 'center', marginTop: spacing.sm },
  stamp: { position: 'absolute', top: 18, zIndex: 2, borderWidth: 3, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, transform: [{ rotate: '-12deg' }] },
  stampPhish: { right: 18, borderColor: c.critical },
  stampLegit: { left: 18, borderColor: c.success, transform: [{ rotate: '12deg' }] },
  stampText: { fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  buttons: { flexDirection: 'row', gap: spacing.md },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: radius.lg, borderWidth: 1.5 },
  btnLegit: { borderColor: c.success, backgroundColor: `${c.success}1a` },
  btnPhish: { borderColor: c.critical, backgroundColor: `${c.critical}1a` },
  btnText: { fontSize: 15, fontWeight: '800' },
  reveal: { backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: 1.5, padding: spacing.md, gap: 6 },
  revealTitle: { fontSize: 13, fontWeight: '800' },
  revealPts: { fontSize: 16, fontWeight: '800' },
  tell: { color: c.subtle, fontSize: 13, lineHeight: 18 },
  nextBtn: { alignSelf: 'flex-end', backgroundColor: c.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.md, marginTop: 4 },
  nextText: { color: c.bg, fontWeight: '800' },
  bigScore: { color: c.text, fontSize: 40, fontWeight: '900' },
  bigScoreMax: { color: c.muted, fontSize: 16, fontWeight: '600' },
  diffRow: { flexDirection: 'row', gap: spacing.md },
  diffCell: { alignItems: 'center', backgroundColor: c.surface, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, paddingVertical: 8, paddingHorizontal: 16 },
  diffVal: { fontSize: 18, fontWeight: '800' },
  diffLabel: { color: c.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  reviewText: { flex: 1, color: c.subtle, fontSize: 12 },
  reviewVerdict: { fontSize: 11, fontWeight: '700' },
});
