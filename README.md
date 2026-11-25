# Romano

A tiny iPhone app that shows Fabrizio Romano's football transfer posts as a calm, unread inbox.

> **Disclaimer:** this is an unofficial personal project. It is not affiliated with or endorsed by Fabrizio Romano or X.
> It reads his public posts through the third-party [FxTwitter](https://github.com/FixTweet/FxTwitter) API, which can change or break at any time.

## Why

I only opened X to read Fabrizio Romano's transfer news, and I kept ending up doom scrolling when there was nothing new.
I wanted just his posts, at set times, without opening X at all.

## How it works

- One screen: an inbox of unread posts, newest first, with photos when a post has them.
- Swipe a post to mark it as read, or clear everything at once. Pull to refresh.
- Only his own posts: no reposts, no replies to others.
- No links back to X anywhere, and `t.co` links are stripped from the text.
- Local notifications only, at 13:00 and 20:00 every day, plus one reminder on day 6 to reinstall (see below).
- Posts and read state stay on the phone. There is no server and no account.

## The journey

I built this with Claude Code in a single session, and it went through three versions:

1. **A script on my Mac.** A Python script fetched his posts from the FxTwitter API and pushed a twice-daily digest (13:00 and 20:00) to my phone through ntfy. Photos came next.
2. **A reader page.** The posts moved off the notification list into a calm reader page served from the Mac, with a twice-daily nudge, swipe to mark as read and pull to refresh. Tailscale made it reachable away from home.
3. **A native app.** That setup broke whenever the Mac's only internet was my phone's hotspot. So it became this app: it fetches posts itself and schedules its own nudges. No server, no Mac at runtime, no paid Apple developer account.

How it was built: Claude Code (Claude Opus 5.5) planned the app and wrote an implementation plan, kept in [`docs/superpowers/plans/`](docs/superpowers/plans/).
It then executed the plan with subagent-driven development.
A fresh Claude Sonnet subagent implemented each task test-first, and a separate reviewer subagent checked the result for spec compliance and quality before the next task began.

## Install on your own iPhone (free Apple ID)

You need a Mac with Xcode and Node, an iPhone, and a cable.

1. Install dependencies:

   ```bash
   npm install
   ```

2. In Xcode, open Settings → Accounts and add your personal Apple ID.
3. Generate the native project:

   ```bash
   npx expo prebuild -p ios
   ```

   If CocoaPods complains about encoding, prefix the command with `LANG=en_US.UTF-8`.
4. Open `ios/*.xcworkspace` in Xcode and choose your Personal Team under Signing & Capabilities.
   If you forked this repo, first change the bundle identifier `com.jtexier.romanoinbox` in `app.config.ts` to your own.
5. Plug in the phone and run:

   ```bash
   npx expo run:ios --device --configuration Release
   ```

6. First install only: on the phone, turn on Developer Mode (Settings → Privacy & Security → Developer Mode), then trust your developer profile under Settings → General → VPN & Device Management.

## The 7-day limit

Apps installed with a free Apple ID expire after 7 days.
The app reminds you on day 6 with a notification.
To renew, plug the phone in and rerun the same `npx expo run:ios --device --configuration Release` command.
A paid Apple developer account removes the limit.

## Development

```bash
npm test               # run the tests
npx tsc --noEmit       # typecheck
npx expo run:ios       # run in the iOS simulator
```

## License

MIT, see [LICENSE](LICENSE).
