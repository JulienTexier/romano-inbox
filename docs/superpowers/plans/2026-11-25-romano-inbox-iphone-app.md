# Romano Inbox iPhone App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A personal iPhone app that shows Fabrizio Romano's posts as an unread inbox and nudges at 13:00 and 20:00, with no Mac, server or paid Apple account involved after install.

**Architecture:** A single-screen Expo (React Native, TypeScript) app. It fetches his latest posts straight from the FxTwitter API on refresh, merges them into an inbox saved on the phone (AsyncStorage), and schedules local repeating notifications. It is installed over USB with `npx expo run:ios --device --configuration Release`, signed by a free Apple ID's Personal Team.

**Tech Stack:** Expo SDK (latest from `create-expo-app`), TypeScript, jest-expo, `@react-native-async-storage/async-storage`, `expo-notifications`, `expo-image`, `expo-constants`, `react-native-gesture-handler` + `react-native-reanimated` (ReanimatedSwipeable).

**Spec:** No separate spec document. The requirements are the decisions made in this session; Global Constraints below holds them verbatim. The working Mac version at `~/.local/share/romano-digest/romano.py` and `index.html` is the reference behaviour to port.

## Global Constraints

- Project root: a permanent folder chosen by the user before Task 1 (the session's scratch folder is deleted with the session). Paths below are relative to it.
- Post source: `GET https://api.fxtwitter.com/2/profile/FabrizioRomano/statuses`, which returns `{ results: RawStatus[] }`, newest first, at most 20, and fails intermittently with HTTP 404.
- Keep only his own posts: drop anything with `reposted_by`; drop replies unless `replying_to.screen_name` is `FabrizioRomano` (case-insensitive).
- Remove every `https://t.co/...` link from post text. The app must never link back to X.
- One picture per post: `media.mosaic.formats.jpeg` if present, else the first photo `url` with `name=orig` replaced by `name=medium`, else the first video's `thumbnail_url`.
- First run: only posts from the last 12 hours go into the inbox; older ones are marked seen.
- Inbox keeps at most 300 posts; the seen-id list keeps the newest 600 ids.
- Nudges: local notifications repeating daily at 13:00 and 20:00 local time, title `📬 Romano catch-up`, body `Open your inbox to see what's new.` No other notification ever fires except the reinstall reminder.
- Reinstall reminder: one notification at 18:00 local time, 6 days after the build time, title `Reinstall Romano`, body `The free install expires tomorrow. Plug in and run the install command.`
- Signing: free Apple ID Personal Team only. Never the company team. The app must not request the Push Notifications capability (`aps-environment`), which Personal Teams cannot sign.
- Bundle identifier: `com.jtexier.romanoinbox`. App name: `Romano`.
- Empty state copy: `You're all caught up` / `Go do something else.`
- Commits: conventional-commit subject, short body, one sentence per line.

## Review Focus

1. The source returns 404 or non-JSON on refresh → saved posts stay on screen and the header says `Couldn't check`; nothing is lost. (Task 2 test `keeps going after transient failures`, Task 5 test `refresh failure keeps saved posts`.)
2. Personal Team signing fails because `expo-notifications` adds `aps-environment` → the config plugin removes it. (Task 4 test `removes aps-environment`.)
3. The user denies notification permission → the inbox still works and the header shows `Notifications off`. (Task 4 test `returns false when permission denied`.)
4. He posts more than 20 times between refreshes → the app flags `Busy day: a few posts may be missing.` (Task 3 test `flags a gap when no known id is returned`.)
5. Stored state is corrupt or from an older shape → the app starts from an empty inbox rather than crashing. (Task 3 test `loadState falls back on corrupt JSON`.)

---

### Task 1: Project scaffold, icon and Personal Team install

**Files:**
- Create: the Expo project (`npx create-expo-app@latest . --template blank-typescript`)
- Modify: `app.json` → replace with `app.config.ts`
- Create: `assets/icon.png` (1024×1024)
- Create: `scripts/make-icon.swift`

**Interfaces:**
- Produces: `Constants.expoConfig.extra.builtAt: number` (epoch ms, set when the config is evaluated at build time), used by Task 4.

- [ ] **Step 1:** Scaffold the project in the project root, then `git init` and make an initial commit.
- [ ] **Step 2:** Install dependencies with `npx expo install @react-native-async-storage/async-storage expo-notifications expo-image expo-constants react-native-gesture-handler react-native-reanimated` and `npm i -D jest-expo jest @types/jest`. Add `"test": "jest"` and `"jest": { "preset": "jest-expo" }` to `package.json`.
- [ ] **Step 3:** Write `app.config.ts`: name `Romano`, slug `romano-inbox`, `ios.bundleIdentifier` `com.jtexier.romanoinbox`, `ios.supportsTablet: false`, icon `./assets/icon.png`, `extra.builtAt: Date.now()`, plugins `expo-notifications` (Task 4 adds its own plugin after it).
- [ ] **Step 4:** Port the Mac icon script to `scripts/make-icon.swift` at 1024×1024 (green pitch gradient, stripes, centre circle, ⚽). Run `swift scripts/make-icon.swift assets/icon.png`. Expected: `file assets/icon.png` reports `1024 x 1024`.
- [ ] **Step 5:** Run `npm test -- --passWithNoTests`. Expected: exit 0.
- [ ] **Step 6:** Commit `chore: scaffold Romano inbox app`.

### Task 2: Post parsing and fetching

**Files:**
- Create: `src/posts.ts`, `src/source.ts`
- Test: `__tests__/posts.test.ts`, `__tests__/source.test.ts`

**Interfaces:**
- Produces:
  - `type RawStatus = { id: string; text?: string; created_timestamp?: number; created_at: string; replying_to?: { screen_name?: string } | string | null; reposted_by?: unknown; media?: { all?: { type: string; url?: string; thumbnail_url?: string }[]; mosaic?: { formats?: { jpeg?: string } } } }`
  - `type Post = { id: string; ts: number /* epoch seconds */; text: string; image: string | null }`
  - `isOwnPost(s: RawStatus): boolean`, `cleanText(t: string | undefined): string`, `imageUrl(media: RawStatus['media']): string | null`, `toPost(s: RawStatus): Post`
  - `fetchLatest(opts?: { fetchImpl?: typeof fetch; attempts?: number; sleep?: (ms: number) => Promise<void> }): Promise<RawStatus[]>` (default 3 attempts, waits 1000 ms then 3000 ms; throws the last error)

- [ ] **Step 1: Write the failing tests**

```ts
// posts.test.ts
test('drops reposts and replies to others, keeps own threads', () => {
  expect(isOwnPost({ id: '1', created_at: '', reposted_by: { screen_name: 'x' } })).toBe(false);
  expect(isOwnPost({ id: '2', created_at: '', replying_to: { screen_name: 'someone' } })).toBe(false);
  expect(isOwnPost({ id: '3', created_at: '', replying_to: { screen_name: 'fabrizioromano' } })).toBe(true);
  expect(isOwnPost({ id: '4', created_at: '', replying_to: null })).toBe(true);
});
test('strips t.co links and collapses blank lines', () => {
  expect(cleanText('Here we go! https://t.co/abc\n\n\n\nDone')).toBe('Here we go!\n\nDone');
});
test('picks mosaic, then medium photo, then video thumbnail', () => {
  expect(imageUrl({ mosaic: { formats: { jpeg: 'M' } }, all: [{ type: 'photo', url: 'P?name=orig' }] })).toBe('M');
  expect(imageUrl({ all: [{ type: 'photo', url: 'P?name=orig' }] })).toBe('P?name=medium');
  expect(imageUrl({ all: [{ type: 'video', thumbnail_url: 'T' }] })).toBe('T');
  expect(imageUrl(undefined)).toBeNull();
});
test('toPost falls back to created_at when created_timestamp is missing', () => {
  expect(toPost({ id: '9', created_at: 'Tue Nov 24 14:28:54 +0000 2026', text: 'x' }).ts).toBe(1795530534);
});

// source.test.ts
test('keeps going after transient failures', async () => {
  const fetchImpl = jest.fn()
    .mockResolvedValueOnce({ ok: false, status: 404 })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ results: [{ id: '1', created_at: '' }] }) });
  await expect(fetchLatest({ fetchImpl, sleep: async () => {} })).resolves.toHaveLength(1);
});
test('throws after the last attempt', async () => {
  const fetchImpl = jest.fn().mockResolvedValue({ ok: false, status: 404 });
  await expect(fetchLatest({ fetchImpl, attempts: 3, sleep: async () => {} })).rejects.toThrow('404');
  expect(fetchImpl).toHaveBeenCalledTimes(3);
});
```

- [ ] **Step 2:** Run `npm test -- posts source`. Expected: FAIL, modules not found.
- [ ] **Step 3:** Implement `src/posts.ts` and `src/source.ts` to the signatures above, porting `clean`, `is_own_post` and `image_url` from `romano.py`. `fetchLatest` treats a non-ok response as an error whose message contains the status code, and returns `results ?? []`.
- [ ] **Step 4:** Run `npm test -- posts source`. Expected: PASS.
- [ ] **Step 5:** Commit `feat: parse and fetch Romano posts`.

### Task 3: Inbox state and storage

**Files:**
- Create: `src/inbox.ts`, `src/storage.ts`
- Test: `__tests__/inbox.test.ts`, `__tests__/storage.test.ts`

**Interfaces:**
- Consumes: `RawStatus`, `Post`, `isOwnPost`, `toPost` (Task 2).
- Produces:
  - `type InboxState = { inbox: Post[] /* oldest first */; seen: string[]; maybeGap: boolean; lastChecked: number | null }`
  - `emptyState(): InboxState`
  - `mergeFetched(state: InboxState, fetched: RawStatus[], nowSec: number): { state: InboxState; added: number }` (pure; sets `lastChecked = nowSec`)
  - `markRead(state: InboxState, ids: string[]): InboxState` (also clears `maybeGap`)
  - `loadState(): Promise<InboxState>`, `saveState(s: InboxState): Promise<void>` (AsyncStorage key `romano-inbox-v1`)

- [ ] **Step 1: Write the failing tests**

```ts
const raw = (id: string, ts: number, extra = {}) => ({ id, created_at: '', created_timestamp: ts, text: `post ${id}`, ...extra });

test('first run keeps only the last 12 hours but marks everything seen', () => {
  const now = 100_000;
  const { state, added } = mergeFetched(emptyState(), [raw('2', now - 3600), raw('1', now - 13 * 3600)], now);
  expect(added).toBe(1);
  expect(state.inbox.map(p => p.id)).toEqual(['2']);
  expect(state.seen.sort()).toEqual(['1', '2']);
});
test('adds only unseen own posts, oldest first', () => {
  const s0 = { ...emptyState(), seen: ['1'] };
  const { state, added } = mergeFetched(s0, [raw('3', 30), raw('2', 20, { reposted_by: {} }), raw('1', 10)], 40);
  expect(added).toBe(1);
  expect(state.inbox.map(p => p.id)).toEqual(['3']);
});
test('flags a gap when no known id is returned', () => {
  const s0 = { ...emptyState(), seen: ['1'] };
  expect(mergeFetched(s0, [raw('5', 50)], 60).state.maybeGap).toBe(true);
});
test('caps inbox at 300 and seen at 600', () => {
  const many = Array.from({ length: 700 }, (_, i) => raw(String(1000 + i), i));
  const { state } = mergeFetched({ ...emptyState(), seen: ['0'] }, many, 1000);
  expect(state.inbox).toHaveLength(300);
  expect(state.seen).toHaveLength(600);
});
test('markRead removes ids and clears the gap flag', () => {
  const s = { ...emptyState(), maybeGap: true, inbox: [{ id: 'a', ts: 1, text: '', image: null }] };
  expect(markRead(s, ['a'])).toMatchObject({ inbox: [], maybeGap: false });
});

// storage.test.ts (AsyncStorage jest mock from @react-native-async-storage/async-storage/jest/async-storage-mock)
test('loadState falls back on corrupt JSON', async () => {
  await AsyncStorage.setItem('romano-inbox-v1', '{not json');
  await expect(loadState()).resolves.toEqual(emptyState());
});
test('saveState then loadState round-trips', async () => { /* save a state with one post, load it, toEqual */ });
```

- [ ] **Step 2:** Run `npm test -- inbox storage`. Expected: FAIL.
- [ ] **Step 3:** Implement to the interfaces, porting `collect` from `romano.py` (first run = `seen` is empty; gap = `seen` non-empty, `fetched` non-empty, and no fetched id in `seen`; keep the newest 600 seen ids by numeric order, using `BigInt` because ids exceed 2^53). `loadState` returns `emptyState()` on missing key, bad JSON, or a value without an `inbox` array.
- [ ] **Step 4:** Run `npm test -- inbox storage`. Expected: PASS.
- [ ] **Step 5:** Commit `feat: keep an unread inbox on the phone`.

### Task 4: Nudges, reinstall reminder and the signing plugin

**Files:**
- Create: `src/nudges.ts`, `plugins/withoutPushEntitlement.js`
- Modify: `app.config.ts` (add `./plugins/withoutPushEntitlement` after `expo-notifications`)
- Modify: `App.tsx` (call `scheduleNudges` once on launch)
- Test: `__tests__/nudges.test.ts`, `__tests__/withoutPushEntitlement.test.ts`

**Interfaces:**
- Consumes: `Constants.expoConfig.extra.builtAt` (Task 1).
- Produces: `scheduleNudges(builtAtMs: number, nowMs?: number): Promise<boolean>` (resolves false when permission is not granted); `removeApsEnvironment(entitlements: Record<string, unknown>): Record<string, unknown>` exported from the plugin file alongside the default `withEntitlementsPlist` plugin.

- [ ] **Step 1: Write the failing tests** (mock `expo-notifications`)

```ts
test('schedules 13:00 and 20:00 daily plus one reinstall reminder', async () => {
  Notifications.requestPermissionsAsync.mockResolvedValue({ granted: true });
  const builtAt = new Date(2026, 10, 25, 10, 0).getTime();
  await expect(scheduleNudges(builtAt, builtAt)).resolves.toBe(true);
  expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
  const triggers = Notifications.scheduleNotificationAsync.mock.calls.map(c => c[0].trigger);
  expect(triggers).toEqual(expect.arrayContaining([
    expect.objectContaining({ type: 'daily', hour: 13, minute: 0 }),
    expect.objectContaining({ type: 'daily', hour: 20, minute: 0 }),
    expect.objectContaining({ type: 'date', date: new Date(2026, 11, 1, 18, 0) }),
  ]));
});
test('skips the reinstall reminder once its time has passed', async () => { /* nowMs after reminder → only 2 schedules */ });
test('returns false when permission denied', async () => {
  Notifications.requestPermissionsAsync.mockResolvedValue({ granted: false });
  await expect(scheduleNudges(0, 0)).resolves.toBe(false);
  expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
});

// withoutPushEntitlement.test.ts
test('removes aps-environment', () => {
  expect(removeApsEnvironment({ 'aps-environment': 'development', other: 1 })).toEqual({ other: 1 });
});
```

- [ ] **Step 2:** Run `npm test -- nudges withoutPushEntitlement`. Expected: FAIL.
- [ ] **Step 3:** Implement `scheduleNudges` with `SchedulableTriggerInputTypes.DAILY` / `DATE` and the copy from Global Constraints; implement the plugin with `withEntitlementsPlist` from `expo/config-plugins`.
- [ ] **Step 4:** Run the tests. Expected: PASS. Then `npx expo prebuild -p ios --clean` and `grep -c aps-environment ios/*/*.entitlements`. Expected: `0`.
- [ ] **Step 5:** Commit `feat: schedule daily nudges without push entitlement`.

### Task 5: Inbox screen

**Files:**
- Create: `src/useInbox.ts`, `src/PostCard.tsx`
- Modify: `App.tsx`
- Test: `__tests__/useInbox.test.ts` (with `@testing-library/react-native`'s `renderHook`; add it as a dev dependency)

**Interfaces:**
- Consumes: `fetchLatest` (Task 2), `loadState`, `saveState`, `mergeFetched`, `markRead` (Task 3). The screen (not the hook) uses the `scheduleNudges` result from Task 4.
- Produces: `useInbox(deps?: { fetchLatest?: typeof fetchLatest }): { posts: Post[] /* newest first */; status: string; refreshing: boolean; maybeGap: boolean; refresh(): Promise<void>; read(ids: string[]): void }`

- [ ] **Step 1: Write the failing tests**

```ts
test('refresh adds new posts and reports them', async () => { /* fetchLatest resolves one new raw post → posts has 1, status 'Up to date · HH:MM' or '1 new just now' */ });
test('refresh failure keeps saved posts', async () => { /* saved state has 2 posts, fetchLatest rejects → posts still 2, status starts with "Couldn't check" */ });
test('read removes posts and persists', async () => { /* read([id]) → posts shrink and saveState called without that id */ });
```

- [ ] **Step 2:** Run `npm test -- useInbox`. Expected: FAIL.
- [ ] **Step 3:** Implement `useInbox`: load saved state on mount and show it at once, then refresh; refresh again whenever `AppState` becomes `active`; ignore a refresh while one is running. Status strings: `N new just now`, `Up to date · HH:MM`, `Couldn't check · showing saved posts`.
- [ ] **Step 4:** Run `npm test -- useInbox`. Expected: PASS.
- [ ] **Step 5:** Build the screen in `App.tsx` matching the Mac page (`index.html`): header `Romano` with unread count and status, `Clear all` button, gap note, `FlatList` with `RefreshControl` for pull-to-refresh, `PostCard` in a `ReanimatedSwipeable` that calls `read([id])` on a full swipe either way and shows a green `✓ Read` strip, a `✓ Read` button, time label (`HH:MM`, `Yesterday HH:MM`, or weekday date), `expo-image` picture, empty state copy, and a `Notifications off` hint when `scheduleNudges` resolved false. Wrap the app in `GestureHandlerRootView`, follow the system light/dark scheme.
- [ ] **Step 6:** Run `npx expo run:ios` on a simulator. Expected: posts load, pull-to-refresh spins then updates the status, swiping a card removes it, relaunching keeps the read state.
- [ ] **Step 7:** Commit `feat: add the inbox screen`.

### Task 6: Install on the iPhone and retire the Mac version

**Files:**
- Create: `README.md` (install and weekly reinstall instructions)

- [ ] **Step 1:** User adds their personal Apple ID in Xcode → Settings → Accounts, opens `ios/*.xcworkspace`, and selects that account's **Personal Team** under Signing & Capabilities. Expected: no signing errors; the team shown is not the company team.
- [ ] **Step 2:** With the iPhone plugged in, run `npx expo run:ios --device --configuration Release` and choose the iPhone. On first install, the user turns on Developer Mode and trusts the developer under Settings → General → VPN & Device Management. Expected: the Romano app opens on the phone with Wi-Fi and hotspot off, and pull-to-refresh works on mobile data.
- [ ] **Step 3:** Write `README.md` with the install command, the first-install trust steps and the weekly reinstall note. Commit `docs: add install instructions`.
- [ ] **Step 4:** After the user confirms a 13:00 or 20:00 nudge arrived from the app, and with their go-ahead, retire the Mac version: `launchctl bootout gui/$(id -u)/com.romano-digest.{collect,serve,nudge}`, delete the three plists in `~/Library/LaunchAgents`, `~/.local/share/romano-digest` and `~/.local/bin/romano`. Expected: `launchctl list | grep romano` prints nothing. The user can then unsubscribe from the ntfy topic and uninstall ntfy.
