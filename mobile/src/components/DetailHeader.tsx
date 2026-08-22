import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useColors } from '../theme/ThemeProvider';
import type { Palette } from '../theme/palettes';
import { spacing } from '../theme/spacing';

/** Our own slim header for pushed screens: identical on iOS and Android, no system chrome. */
export function DetailHeader({ title, right }: { title: string; right?: ReactNode }) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };
  return (
    <View style={s.row}>
      <Pressable onPress={back} hitSlop={12} style={({ pressed }) => [s.back, pressed && s.pressed]} accessibilityRole="button" accessibilityLabel="Back">
        <ChevronLeft size={24} color={colors.accent} />
      </Pressable>
      <Text style={s.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={s.right}>{right}</View>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      backgroundColor: c.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    pressed: { backgroundColor: c.surfaceAlt },
    title: { flex: 1, color: c.text, fontSize: 18, fontWeight: '700' },
    right: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 40, justifyContent: 'flex-end', paddingRight: 4 },
  });
