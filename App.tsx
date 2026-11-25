import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from './src/Header';
import { scheduleNudges } from './src/nudges';
import { PostCard } from './src/PostCard';
import { useTheme } from './src/theme';
import { useInbox } from './src/useInbox';

function Inbox() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { posts, status, refreshing, loaded, everChecked, maybeGap, refresh, read } = useInbox();
  const [notificationsOn, setNotificationsOn] = useState<boolean | null>(null);

  useEffect(() => {
    const builtAt = Number(Constants.expoConfig?.extra?.builtAt ?? Date.now());
    scheduleNudges(builtAt).then(setNotificationsOn, () => setNotificationsOn(false));
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PostCard post={item} onRead={(id) => read([id])} />}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        stickyHeaderIndices={[0]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.muted} />}
        ListHeaderComponent={
          <View style={{ backgroundColor: theme.bg }}>
            <Header count={posts.length} status={status} onClearAll={() => read(posts.map((p) => p.id))} />
            {maybeGap ? <Text style={[styles.note, { color: theme.warn }]}>Busy day: a few posts may be missing.</Text> : null}
            {notificationsOn === false ? <Text style={[styles.note, { color: theme.warn }]}>Notifications off</Text> : null}
          </View>
        }
        ListEmptyComponent={
          !loaded ? undefined : (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>⚽</Text>
              <Text style={[styles.emptyTitle, { color: theme.ink }]}>
                {everChecked ? "You're all caught up" : 'Nothing loaded yet'}
              </Text>
              <Text style={{ color: theme.muted }}>{everChecked ? 'Go do something else.' : 'Pull down to try again.'}</Text>
            </View>
          )
        }
      />
      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <Inbox />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  screen: { flex: 1 },
  content: { paddingHorizontal: 16 },
  note: { fontSize: 14, marginBottom: 10 },
  empty: { alignItems: 'center', paddingTop: 140, paddingHorizontal: 16 },
  emptyIcon: { fontSize: 44 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 8, marginBottom: 4 },
});
