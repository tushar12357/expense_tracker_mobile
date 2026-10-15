# SpendSense mobile

React Native (Expo SDK 57, Expo Router) client for the SpendSense API in `../expense tracker`.

## Run

```bash
# 1. backend (from ../expense tracker): postgres up, then
npm run dev                      # http://localhost:5000

# 2. app (this folder)
npm install
npx expo start                   # scan the QR with Expo Go, or press a / i
```

**API address.** The app derives it from the Metro host (`http://<your-pc-ip>:5000`), so a phone on the same Wi-Fi works
without setup. Override with `EXPO_PUBLIC_API_URL=http://192.168.x.x:5000`, or at runtime via *Server settings* on the
login screen / *More → Server*. Android emulator fallback is `http://10.0.2.2:5000`.

## Structure

```
src/app/            routes (Expo Router)
  (auth)/           login, register
  (tabs)/           Home, Activity, Insights, Plan, More
  transaction/      new, [id]
  imports/          history, upload, [id] batch detail
  accounts, categories, rules, profile, security
src/components/     ui kit, charts (SVG), domain widgets
src/hooks/queries   React Query hook per endpoint
src/lib/            api client, types, formatting (Indian grouping), icon maps
src/providers/      auth (SecureStore token), toast
```

## API coverage

Auth/profile/export/delete · accounts · categories · merchant rules (+apply) · transactions (cursor pagination, filters,
search, create/correct/delete) · imports (adapters, multipart upload, async polling, row outcomes) · dashboard, category
breakdown, trends, insights (forecast, safe-to-spend, recurring) · budgets · savings goals.

Checks: `npx tsc --noEmit` and `npx eslint src` are clean.
