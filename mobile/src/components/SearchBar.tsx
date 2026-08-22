import { useMemo } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useColors } from '../theme/ThemeProvider';
import type { Palette } from '../theme/palettes';
import { radius, spacing } from '../theme/spacing';

interface Props extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (t: string) => void;
  onSubmit?: () => void;
}

export function SearchBar({ value, onChangeText, onSubmit, placeholder = 'Search…', ...rest }: Props) {
  const colors = useColors();
  const s = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={s.wrap}>
      <Search size={16} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={s.input}
        {...rest}
      />
      {value ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={8}>
          <X size={16} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  input: { flex: 1, color: c.text, fontSize: 14, paddingVertical: 0 },
});
