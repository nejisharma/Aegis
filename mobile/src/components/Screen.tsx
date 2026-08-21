import React from 'react';
import { ScrollView, StyleSheet, View, type RefreshControlProps, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface ScreenProps {
  children: React.ReactNode;
  /** Wrap content in a ScrollView. */
  scroll?: boolean;
  /** Apply standard padding around the content. */
  padded?: boolean;
  /** Safe-area edges to respect (default: no top, since navigation headers handle it). */
  edges?: Edge[];
  style?: ViewStyle;
  /** Passed to the ScrollView when `scroll` is set (e.g. a RefreshControl). */
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

export function Screen({
  children,
  scroll = false,
  padded = false,
  edges = ['left', 'right', 'bottom'],
  style,
  refreshControl,
}: ScreenProps) {
  const inner = padded ? styles.padded : undefined;
  return (
    <SafeAreaView style={[styles.root, style]} edges={edges}>
      {scroll ? (
        <ScrollView
          style={styles.root}
          contentContainerStyle={[styles.scrollContent, inner]}
          refreshControl={refreshControl}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.root, inner]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  padded: { padding: spacing.lg },
  scrollContent: { flexGrow: 1 },
});
