import * as Notifications from 'expo-notifications';
import { scheduleNudges } from '../src/nudges';

jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DAILY: 'daily', DATE: 'date' },
  requestPermissionsAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
}));

const N = Notifications as unknown as {
  requestPermissionsAsync: jest.Mock;
  cancelAllScheduledNotificationsAsync: jest.Mock;
  scheduleNotificationAsync: jest.Mock;
};

beforeEach(() => jest.clearAllMocks());

test('schedules 13:00 and 20:00 daily plus one reinstall reminder', async () => {
  N.requestPermissionsAsync.mockResolvedValue({ granted: true });
  const builtAt = new Date(2026, 10, 25, 10, 0).getTime();
  await expect(scheduleNudges(builtAt, builtAt)).resolves.toBe(true);
  expect(N.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
  const calls = N.scheduleNotificationAsync.mock.calls.map((c) => c[0]);
  expect(calls).toHaveLength(3);
  expect(calls.map((c) => c.trigger)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ type: 'daily', hour: 13, minute: 0 }),
      expect.objectContaining({ type: 'daily', hour: 20, minute: 0 }),
      expect.objectContaining({ type: 'date', date: new Date(2026, 11, 1, 18, 0) }),
    ]),
  );
  expect(calls.map((c) => c.content)).toEqual(
    expect.arrayContaining([
      { title: '📬 Romano catch-up', body: "Open your inbox to see what's new." },
      {
        title: 'Reinstall Romano',
        body: 'The free install expires soon. Plug in and run the install command.',
      },
    ]),
  );
});

test('skips the reinstall reminder once its time has passed', async () => {
  N.requestPermissionsAsync.mockResolvedValue({ granted: true });
  const builtAt = new Date(2026, 10, 25, 10, 0).getTime();
  const now = new Date(2026, 11, 1, 18, 0, 1).getTime();
  await expect(scheduleNudges(builtAt, now)).resolves.toBe(true);
  expect(N.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
});

test('returns false when permission denied', async () => {
  N.requestPermissionsAsync.mockResolvedValue({ granted: false });
  await expect(scheduleNudges(0, 0)).resolves.toBe(false);
  expect(N.scheduleNotificationAsync).not.toHaveBeenCalled();
});
