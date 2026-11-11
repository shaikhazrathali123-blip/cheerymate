# 🍒 Cherrymate

**Find someone you can comfortably live with — not just split rent with.**
A mobile-first PWA for roommate matching in India: Google sign-in, lifestyle onboarding, Tinder-style swiping with a compatibility score, a privacy-first nearby map of people and flats, mutual matches and real-time chat.

Stack: Next.js 15 (App Router, Server Components, Server Actions) · TypeScript · Tailwind CSS 4 · shadcn-style UI + vaul bottom sheets · Framer Motion · Google OAuth 2.0 (direct, with PKCE — no auth library) + signed `jose` session cookie · MongoDB Atlas + Mongoose (2dsphere) · Pusher Channels · Cloudinary · MapLibre GL via `react-map-gl/maplibre` + OpenFreeMap · Serwist · web-push · Zod + React Hook Form.

---

## Project structure

```
app/                 Routes (App Router)
  (app)/             Signed-in + onboarded area: discover, map, matches, chat, profile, settings
  api/               Route handlers: auth/google (+ /callback), discover, map/nearby, matches/[id]/messages|read, pusher/auth, profile/[id], upload/sign, unread
  onboarding/        5-step wizard
  login/ offline/    Public pages
  manifest.ts sw.ts  PWA manifest + Serwist service worker
  globals.css        ⭐ THE design system — every colour/radius/shadow token (light + dark)
actions/             Server Actions: profile, swipe, location, safety, settings, push
components/          ui/ (button, chip, sheet, switch, photo, misc) · shell/ · discover/ · map/ · chat/ · profile/ · profile-form/ · onboarding/ · pwa/ · push/
hooks/               use-install, use-push, use-dark
lib/                 db, google-oauth, session-token, auth, session, matching, geo, discover, chat, queries, pusher(-client), push, cloudinary, rate-limit, validators, constants, utils
models/              User, Swipe, Match, Message, Report/Block/PushSubscription/RateLimit
scripts/             seed.ts, ensure-indexes.ts, generate-icons.mjs
types/               Shared types (PublicCard etc.)
```

### Changing the look
All styling is token-driven. Edit `:root` (light) and the `prefers-color-scheme: dark` block in **`app/globals.css`** — e.g. change `--brand` and every button, chip, badge, ring, bubble and map accent follows. Tailwind utilities map to tokens (`bg-brand`, `bg-surface`, `text-muted`, `border-line`, `rounded-card`, `shadow-card`), plus custom utilities `glass`, `brand-gradient`, `nav-active`, `chip-active`, `page-glow`, `pb-nav`, `pt-safe`.

---

## Setup

### 1. Install
```bash
npm install
cp .env.example .env.local
```

### 2. MongoDB Atlas
1. Create a free cluster at <https://cloud.mongodb.com>, add a database user and allow your IP (or `0.0.0.0/0` for Vercel).
2. Put the connection string in `MONGODB_URI` **with a database name**, e.g. `…mongodb.net/cherrymate?retryWrites=true&w=majority`.
3. Create indexes (including the **2dsphere** index on `users.location`, required by `$geoNear`):
   ```bash
   npm run indexes
   ```
   Or manually in Atlas → Collections → `users` → Indexes → `{ "location": "2dsphere" }`.

### 3. Google sign-in (plain OAuth 2.0 — no Auth.js)
1. <https://console.cloud.google.com> → APIs & Services → **OAuth consent screen** (External; scopes `openid`, `email`, `profile`; add your Gmail as a test user while in Testing mode).
2. **Credentials → Create credentials → OAuth client ID → Web application**.
3. Authorised JavaScript origins: `http://localhost:3000`, `https://your-domain.vercel.app`
4. Authorised redirect URIs (must match exactly):
   - `http://localhost:3000/api/auth/google/callback`
   - `https://your-domain.vercel.app/api/auth/google/callback`
5. Copy into `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, and set `AUTH_SECRET` to a random 32+ character string (`openssl rand -base64 32`).

How it works: `/api/auth/google` redirects to Google with `state`, `nonce` and a PKCE challenge (kept in a 10-minute httpOnly cookie). `/api/auth/google/callback` checks `state`, exchanges the code, verifies Google's signed ID token (signature, issuer, audience, expiry, nonce, verified email), creates or links the user by Google id / email, and sets `cm_session` — an httpOnly, HS256-signed JWT (30 days) that the middleware verifies on every request. Sign-out deletes the cookie. Code: `lib/google-oauth.ts`, `lib/session-token.ts`, `app/api/auth/google/**`.

### 4. Pusher Channels
1. Create a Channels app at <https://dashboard.pusher.com> (cluster `ap2` = Mumbai).
2. App Settings → **enable "Client events"** (used for the typing indicator).
3. Fill `PUSHER_*` and `NEXT_PUBLIC_PUSHER_*`.
Without Pusher the app still works; chat just won't update live.

### 5. Cloudinary
Create a free account and copy cloud name / API key / secret into `CLOUDINARY_*`. Uploads go browser → Cloudinary with a server-signed request (images are downscaled on-device first, which also strips EXIF/GPS). Without Cloudinary, onboarding still works using your Google photo.

### 6. Map tiles
Default is **OpenFreeMap** — free, no key: `NEXT_PUBLIC_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/positron` (dark: `/styles/dark`). To use MapTiler, set a style URL containing `{key}` and `NEXT_PUBLIC_MAPTILER_KEY`.

### 7. Web push (VAPID)
```bash
npm run vapid
```
Put the public key in `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, the private key in `VAPID_PRIVATE_KEY`, and a `mailto:` in `VAPID_SUBJECT`.

### 8. Run locally
```bash
npm run dev
```
Open <http://localhost:3000>. The service worker is **disabled in dev**; to test PWA/offline/push run a production build:
```bash
npm run build
npm start
```

### 9. Seed test data
```bash
npm run seed
```
Creates ~30 Indian profiles in Bangalore, Hyderabad and Pune (fuzzed locations across real localities, some on the map, some with flats), likes between them and 3 matches with messages.
To test matching yourself: sign in once, finish onboarding (pick one of those cities), then:
```bash
SEED_LIKE_EMAIL=you@gmail.com npm run seed
```
(PowerShell: `$env:SEED_LIKE_EMAIL="you@gmail.com"; npm run seed`) — 8 seeded people will have already liked you, so liking them back triggers "It's a match!".

---

## Testing the PWA on a real phone (HTTPS required)
Service workers, install and push need HTTPS (except `localhost`).
- **Easiest:** deploy a preview to Vercel and open it on your phone.
- **Local tunnel:** `npm run build && npm start`, then `npx cloudflared tunnel --url http://localhost:3000` (or ngrok). Add the tunnel URL to the Google OAuth origins/redirect URIs and set `APP_URL` to the tunnel URL.
- Android/Chrome: you'll see our own **Install Cherrymate** banner. iOS Safari: a "Share → Add to Home Screen" guide. iOS push works only after installing to the Home Screen (iOS 16.4+).
- Lighthouse: Chrome DevTools → Lighthouse → Mobile, throttling "Slow 4G", on the production build. Target 90+.

## Troubleshooting

**Blank white page on localhost + "Failed to load module script … MIME type text/html" (often mentioning `@vite/client` or `workbox-*.js`)**
A service worker from *another* app you ran on the same port (e.g. a Vite PWA) is still registered on `localhost:3000` and serves its old cached page. In dev, Cherrymate evicts it automatically (`lib/dev-sw-cleanup.ts`) — restart `npm run dev` and reload. If it persists: DevTools → Application → Service workers → **Unregister**, then Storage → **Clear site data**, or simply run on another port (`npm run dev -- -p 3001`, and add that port to Google OAuth).

**Sign-in fails and the server logs `querySrv EBADRESP _mongodb._tcp…`** — your network's DNS can't resolve the `mongodb+srv://` SRV record (typical on phone hotspots). The app retries automatically with public DNS (8.8.8.8 / 1.1.1.1); you can force it with `MONGODB_DNS_SERVERS="8.8.8.8,1.1.1.1"`, or change your PC's DNS.

**Hydration warning mentioning `cz-shortcut-listen`, `data-gr-*` etc.** — injected by browser extensions (ColorZilla, Grammarly); harmless and suppressed on `<body>`.

## Deploying to Vercel
1. Push to GitHub, import the repo in Vercel.
2. Add every variable from `.env.example` in Project Settings → Environment Variables (set `APP_URL` to your production URL).
3. Add the production domain to Google OAuth origins + redirect URIs.
4. Deploy, then run `npm run indexes` once against the production DB.

---

## How things work

**Matching** (`lib/matching.ts`): hard filters run in MongoDB on both Discover and Map — same city, gender preference **both ways**, age range **both ways**, dealbreakers **both ways** (my dealbreakers → conditions on them; their dealbreakers → `$nin` of the ones I violate), never paused/blocked/swiped/matched. Score 0–100 = lifestyle similarity (70, cleanliness/sleep/food/smoking weighted highest) + budget overlap (15) + shared localities (10) + move-in within ~30 days (5). Complementary looking types (has flat ↔ needs flat) get a ranking boost. A Match is created atomically (unique `pairKey`) when a like is mutual, from Discover or Map.

**Location privacy** (`lib/geo.ts`, `actions/location.ts`): opt-in, off by default. Coordinates are snapped to a ~500 m grid cell plus a fixed random per-user offset (generated once, stored hidden); **only the fuzzed point is saved**. GPS refresh at most every 6 h and only when the app is opened. Distances are computed between fuzzed points and rounded ("< 1 km", "~2 km", "~5 km"). Map zoom is capped, results are capped at 200 and rate-limited. Ghost mode and "Only show me to women" are enforced server-side.

**Chat**: `POST /api/matches/[id]/messages` validates (Zod), saves, triggers `private-match-{id}` and the recipient's `private-user-{id}` channel, and sends a push (the service worker skips it if that chat is open and visible). The Pusher auth endpoint only authorises active, unblocked members. Messages typed offline are queued in localStorage with a client id (idempotent retries) and sent on reconnect (clock → tick → double tick when read).

**Safety**: only matches can message; block hides both people everywhere and closes the chat in real time; report flow with reasons; the safety banner sits at the top of every chat; likes (100/day), messages (30/min), map queries (30/min), uploads and reports are rate-limited.

**Delete account** removes the user, swipes, matches, messages, blocks, their reports, push subscriptions, and Cloudinary folders.
