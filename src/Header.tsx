import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from './theme';

export function Header({ count, status, onClearAll }: { count: number; status: string; onClearAll: () => void }) {
  const theme = useTheme();
  const sub = count > 0 ? `${count} unread · ${status}` : status;
  return (
    <View style={[styles.header, { backgroundColor: theme.bg }]}>
      <View style={styles.titles}>
        <Text style={[styles.title, { color: theme.ink }]}>Romano</Text>
        <Text style={[styles.sub, { color: theme.muted }]}>{sub}</Text>
      </View>
      {count > 0 ? (
        <Pressable
          accessibilityRole="button"
          onPress={onClearAll}
          style={[styles.clear, { backgroundColor: theme.accent, borderColor: theme.accent }]}
        >
          <Text style={[styles.clearText, { color: theme.accentInk }]}>Clear all</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 14, paddingBottom: 10 },
  titles: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700', letterSpacing: -0.2 },
  sub: { fontSize: 13 },
  clear: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  clearText: { fontSize: 15, fontWeight: '600' },
});
