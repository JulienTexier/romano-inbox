import * as Notifications from 'expo-notifications';

const NUDGE_CONTENT = {
  title: '📬 Romano catch-up',
  body: "Open your inbox to see what's new.",
};
const REINSTALL_CONTENT = {
  title: 'Reinstall Romano',
  body: 'The free install expires soon. Plug in and run the install command.',
};
const NUDGE_HOURS = [13, 20];

export async function scheduleNudges(builtAtMs: number, nowMs: number = Date.now()): Promise<boolean> {
  const { granted } = await Notifications.requestPermissionsAsync();
  if (!granted) return false;

  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const hour of NUDGE_HOURS) {
    await Notifications.scheduleNotificationAsync({
      content: NUDGE_CONTENT,
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute: 0 },
    });
  }

  const built = new Date(builtAtMs);
  const reminderAt = new Date(built.getFullYear(), built.getMonth(), built.getDate() + 6, 18, 0, 0);
  if (reminderAt.getTime() > nowMs) {
    await Notifications.scheduleNotificationAsync({
      content: REINSTALL_CONTENT,
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminderAt },
    });
  }
  return true;
}
