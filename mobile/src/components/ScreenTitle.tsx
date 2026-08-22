import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from 'expo-router';
import { Menu } from 'lucide-react-native';
import { useColors } from '../theme/ThemeProvider';
import type { Palette } from '../theme/palettes';
import { spacing } from '../theme/spacing';

/** Tab-screen heading with the drawer (hamburger) button. */
export function ScreenTitle({ title, right }: { title: string; right?: ReactNode }) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const openDrawer = () => {
    // Tabs live inside the drawer; the parent navigator is the drawer.
    const parent = navigation.getParent() as { openDrawer?: () => void } | undefined;
    parent?.openDrawer?.();
  };
  return (
    <View style={s.row}>
      <Pressable onPress={openDrawer} hitSlop={10} style={s.menu} accessibilityLabel="Open menu">
        <Menu size={22} color={colors.text} />
      </Pressable>
      <Text style={s.h1}>{title}</Text>
      {right ? <View style={s.right}>{right}</View> : null}
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  menu: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
  h1: { color: c.text, fontSize: 22, fontWeight: '700', flex: 1 },
  right: { marginLeft: 'auto' },
});
