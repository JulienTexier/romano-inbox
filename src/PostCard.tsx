import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { PostMedia } from './PostMedia';
import type { Post } from './posts';
import { useTheme, type Theme } from './theme';

export function timeLabel(ts: number, now: Date = new Date()): string {
  const d = new Date(ts * 1000);
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === now.toDateString()) return time;
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return `Yesterday ${time}`;
  const day = d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
  return `${day} ${time}`;
}

function ReadStrip({ side, theme }: { side: 'left' | 'right'; theme: Theme }) {
  return (
    <View style={[styles.strip, { backgroundColor: theme.accent, alignItems: side === 'left' ? 'flex-start' : 'flex-end' }]}>
      <Text style={[styles.stripText, { color: theme.accentInk }]}>✓ Read</Text>
    </View>
  );
}

export function PostCard({ post, onRead }: { post: Post; onRead: (id: string) => void }) {
  const theme = useTheme();
  return (
    <ReanimatedSwipeable
      containerStyle={styles.row}
      friction={1.5}
      leftThreshold={120}
      rightThreshold={120}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={() => <ReadStrip side="left" theme={theme} />}
      renderRightActions={() => <ReadStrip side="right" theme={theme} />}
      onSwipeableOpen={() => onRead(post.id)}
    >
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.line }]}>
        <View style={styles.meta}>
          <Text style={[styles.time, { color: theme.muted }]}>{timeLabel(post.ts)}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => onRead(post.id)}
            style={[styles.readButton, { backgroundColor: theme.card, borderColor: theme.line }]}
          >
            <Text style={[styles.readButtonText, { color: theme.ink }]}>✓ Read</Text>
          </Pressable>
        </View>
        {post.text ? <Text style={[styles.text, { color: theme.ink }]}>{post.text}</Text> : null}
        <PostMedia media={post.media} theme={theme} />
      </View>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: 10, borderRadius: 14, overflow: 'hidden' },
  strip: { flex: 1, justifyContent: 'center', paddingHorizontal: 18, minWidth: 200 },
  stripText: { fontWeight: '600', fontSize: 15 },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  time: { fontSize: 13 },
  readButton: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 3 },
  readButtonText: { fontSize: 13 },
  text: { fontSize: 16, lineHeight: 23 },
});
