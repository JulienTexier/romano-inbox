import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { scheduleNudges } from './src/nudges';

export default function App() {
  const [notificationsOn, setNotificationsOn] = useState<boolean | null>(null);

  useEffect(() => {
    const builtAt = Number(Constants.expoConfig?.extra?.builtAt ?? Date.now());
    scheduleNudges(builtAt).then(setNotificationsOn, () => setNotificationsOn(false));
  }, []);

  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      {notificationsOn === false && <Text>Notifications off</Text>}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
