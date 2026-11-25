This is a single-screen Expo/React Native iPhone app (no Expo Router): the screen is `App.tsx`, everything else is in `src/`.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. Before writing code that touches an Expo or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt and follow its links; never answer from memory.

## Commands

```bash
npx expo install <package>  # ALWAYS use instead of npm add — resolves SDK-compatible versions
npm test                    # jest
npx tsc --noEmit            # typecheck
```

There is no ESLint config. The gates before declaring a task done are `npm test` and `npx tsc --noEmit`.

## Install and native config

- The app is installed locally with a free Apple ID Personal Team: `npx expo run:ios --device --configuration Release`. No EAS.
- `ios/` is generated (Continuous Native Generation) and not committed. Never edit it by hand; configure native behavior in `app.config.ts` and config plugins.
- `plugins/withoutPushEntitlement` strips `aps-environment` (a Personal Team cannot sign it). It must stay listed before `expo-notifications` in `app.config.ts`, because mods run in reverse order.
