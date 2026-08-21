import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

interface Props<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  scroll?: boolean;
}

export function Segmented<T extends string>({ options, value, onChange, scroll }: Props<T>) {
  const content = (
    <View style={s.wrap}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={[s.seg, active && s.segActive]}>
            <Text style={[s.text, active && s.textActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
  if (scroll) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg }}>
        {content}
      </ScrollView>
    );
  }
  return <View style={{ paddingHorizontal: spacing.lg }}>{content}</View>;
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
    gap: 2,
  },
  seg: { flex: 1, paddingVertical: 7, paddingHorizontal: 12, borderRadius: radius.sm, alignItems: 'center' },
  segActive: { backgroundColor: colors.accentDim },
  text: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  textActive: { color: colors.accent },
});
