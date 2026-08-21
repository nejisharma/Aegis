import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

interface Props extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (t: string) => void;
  onSubmit?: () => void;
}

export function SearchBar({ value, onChangeText, onSubmit, placeholder = 'Search…', ...rest }: Props) {
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

const s = StyleSheet.create({
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
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 0 },
});
