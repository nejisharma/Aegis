import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ExternalLink, Share2 } from 'lucide-react-native';
import { Screen } from '../../src/components/Screen';
import { EmptyState, Loading } from '../../src/components/ui';
import { openUrl } from '../../src/lib/browser';
import { shortDate } from '../../src/lib/format';
import { getSaved, type SavedArticle } from '../../src/lib/saved';
import { shareLink } from '../../src/lib/share';
import { getPref, setPref } from '../../src/lib/storage';
import { useColors } from '../../src/theme/ThemeProvider';
import type { Palette } from '../../src/theme/palettes';
import { spacing } from '../../src/theme/spacing';

const FONT_PREF = 'reader-font';
const FONT_MIN = 13;
const FONT_MAX = 24;
const FONT_DEFAULT = 16;

/** Split Readability's textContent into paragraphs: blank lines first, otherwise single newlines. */
function toParagraphs(text: string): string[] {
  const normalized = text.replace(/\r\n?/g, '\n').replace(/[ \t ]+\n/g, '\n');
  const byBlank = normalized.split(/\n\s*\n/);
  const parts = byBlank.length > 1 ? byBlank : normalized.split('\n');
  return parts.map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

export default function ReaderScreen() {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [article, setArticle] = useState<SavedArticle | null | undefined>(undefined);
  const [fontSize, setFontSize] = useState(FONT_DEFAULT);

  useEffect(() => {
    let alive = true;
    getSaved(id ?? '').then((a) => {
      if (alive) setArticle(a ?? null);
    });
    getPref<number>(FONT_PREF, FONT_DEFAULT).then((f) => {
      if (alive && Number.isFinite(f)) setFontSize(Math.min(FONT_MAX, Math.max(FONT_MIN, f)));
    });
    return () => {
      alive = false;
    };
  }, [id]);

  const bump = (delta: number) => {
    const next = Math.min(FONT_MAX, Math.max(FONT_MIN, fontSize + delta));
    setFontSize(next);
    setPref(FONT_PREF, next);
  };

  const paragraphs = useMemo(() => (article ? toParagraphs(article.textContent) : []), [article]);

  return (
    <Screen
      title={article?.source ?? 'Reader'}
      headerRight={
        <View style={s.headerRow}>
      <Pressable onPress={() => bump(-2)} hitSlop={8} disabled={fontSize <= FONT_MIN} style={[s.fontBtn, fontSize <= FONT_MIN && { opacity: 0.4 }]} accessibilityLabel="Smaller text">
        <Text style={s.fontBtnText}>A-</Text>
      </Pressable>
      <Pressable onPress={() => bump(2)} hitSlop={8} disabled={fontSize >= FONT_MAX} style={[s.fontBtn, fontSize >= FONT_MAX && { opacity: 0.4 }]} accessibilityLabel="Larger text">
        <Text style={[s.fontBtnText, { fontSize: 15 }]}>A+</Text>
      </Pressable>
      {article ? (
        <>
          <Pressable onPress={() => openUrl(article.url, colors)} hitSlop={8} style={s.iconBtn} accessibilityLabel="Open original">
            <ExternalLink size={20} color={colors.accent} />
          </Pressable>
          <Pressable onPress={() => shareLink(article.title, article.url)} hitSlop={8} style={s.iconBtn} accessibilityLabel="Share">
            <Share2 size={20} color={colors.accent} />
          </Pressable>
        </>
      ) : null}
        </View>
      }
    >
      {article === undefined ? (
        <Loading />
      ) : article === null ? (
        <EmptyState title="Article not found" message="It may have been removed from your saved list." />
      ) : (
        <ScrollView contentContainerStyle={s.body}>
          <Text style={[s.title, { fontSize: fontSize + 7, lineHeight: (fontSize + 7) * 1.3 }]} selectable>
            {article.title}
          </Text>
          <Text style={s.meta}>
            {[article.byline, article.siteName ?? article.source, shortDate(article.pubDate)].filter(Boolean).join(' · ')}
          </Text>
          <Text style={s.offline}>Saved for offline reading · {shortDate(new Date(article.savedAt))}</Text>
          <View style={{ gap: fontSize * 0.9, marginTop: spacing.md }}>
            {paragraphs.map((p, i) => (
              <Text key={i} style={[s.para, { fontSize, lineHeight: fontSize * 1.6 }]} selectable>
                {p}
              </Text>
            ))}
          </View>
          <Pressable onPress={() => openUrl(article.url, colors)} style={s.original}>
            <ExternalLink size={14} color={colors.accent} />
            <Text style={s.originalText}>Open original article</Text>
          </Pressable>
        </ScrollView>
      )}
    </Screen>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fontBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  fontBtnText: { color: c.accent, fontSize: 12, fontWeight: '700' },
  iconBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  body: { padding: spacing.lg, paddingBottom: spacing.xl * 2, gap: 6 },
  title: { color: c.text, fontWeight: '700' },
  meta: { color: c.subtle, fontSize: 12, marginTop: 4 },
  offline: { color: c.muted, fontSize: 11 },
  para: { color: c.text },
  original: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.xl, alignSelf: 'flex-start' },
  originalText: { color: c.accent, fontSize: 13, fontWeight: '600' },
});
