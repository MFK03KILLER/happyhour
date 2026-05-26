# Google + Apple Sign-In Setup

This explains exactly **where each credential goes** so Sign in with Google and Sign in with Apple work end-to-end.

There are 3 credentials total:

| Name                     | Where you create it                                  | Where it goes (backend)              | Where it goes (customer-app)           |
| ------------------------ | ---------------------------------------------------- | ------------------------------------ | -------------------------------------- |
| Google OAuth Client ID   | Google Cloud Console                                 | `backend/.env` → `GOOGLE_CLIENT_ID`  | `customer-app/.env.production` → `VITE_GOOGLE_CLIENT_ID` |
| Apple Services ID        | Apple Developer → Identifiers                        | `backend/.env` → `APPLE_SERVICE_ID`  | `customer-app/.env.production` → `VITE_APPLE_SERVICE_ID` |
| Apple Team ID            | Apple Developer (top right of any page, 10 chars)    | `backend/.env` → `APPLE_TEAM_ID`     | _not needed in the frontend_           |

The values in `backend/.env` **and** `customer-app/.env.production` must match — the frontend uses them to ask Google/Apple for an ID token, and the backend uses them to verify that the same ID token was actually meant for our app.

---

## 1. Google Sign-In

### 1a. Create the OAuth Client ID

1. Go to <https://console.cloud.google.com/apis/credentials>.
2. Pick (or create) a project named e.g. **Happy Hour**.
3. Configure the **OAuth consent screen** once (External, app name = Happy Hour, your email as developer contact). Add scopes `email`, `profile`, `openid`. While testing, add your own Google account under **Test users**.
4. Back on **Credentials** → **Create credentials** → **OAuth client ID**.
5. Application type = **Web application**. Name it `Happy Hour Customer App`.
6. Under **Authorized JavaScript origins**, add **all** the origins your frontend will run on:
   - `http://localhost:5173` (local dev)
   - `https://130.185.120.120:8443` (prod USA)
   - `https://your-future-domain.com` (when you add a domain)
7. **Authorized redirect URIs** can be left empty — we're using the Google Identity Services JS popup flow (no redirect needed).
8. Click **Create**. Copy the **Client ID** (looks like `1234567890-xxxxxxxxxxxx.apps.googleusercontent.com`).

### 1b. Put the Client ID in the right places

**Backend** — edit `backend/.env` on the server:

```env
GOOGLE_CLIENT_ID=1234567890-xxxxxxxxxxxx.apps.googleusercontent.com
```

Then restart the backend:

```bash
pm2 restart happyhour-backend
```

**Customer-app** — edit `customer-app/.env.production` (create it if missing) on the server:

```env
VITE_API_BASE=https://130.185.120.120:8443/api/v1
VITE_GOOGLE_CLIENT_ID=1234567890-xxxxxxxxxxxx.apps.googleusercontent.com
VITE_APPLE_SERVICE_ID=
VITE_APPLE_REDIRECT_URI=https://130.185.120.120:8443/login
```

Rebuild the frontend (Vite bakes `VITE_*` vars into the bundle, so a rebuild is required):

```bash
cd customer-app
npm run build
```

That's it for Google.

---

## 2. Apple Sign-In

This is more involved than Google, but only needed if you want the Apple button to work (the app falls back gracefully without it).

### 2a. Get your Team ID

1. Log in to <https://developer.apple.com>.
2. Top right corner of the page shows your Team ID (a 10-character string like `AB12CD34EF`). Copy it.

### 2b. Create an App ID

1. Go to **Certificates, Identifiers & Profiles → Identifiers → +**.
2. Choose **App IDs → App**.
3. Description: `Happy Hour`. Bundle ID: `com.happyhour.app` (explicit).
4. Scroll down and tick **Sign in with Apple**.
5. Save.

### 2c. Create a Services ID (this is what goes in your env files)

1. **Identifiers → +** → choose **Services IDs**.
2. Description: `Happy Hour Web`. Identifier: `com.happyhour.web`. Save.
3. Open the Services ID you just created → tick **Sign in with Apple** → **Configure**.
4. Primary App ID: the App ID from step 2b.
5. **Domains and Subdomains**:
   - `130.185.120.120` (or your domain when you have one)
6. **Return URLs** — these must match what your frontend sends. Add:
   - `https://130.185.120.120:8443/login`
   - `http://localhost:5173/login` (for dev)
7. Save. Go back and confirm.

The **Identifier** of this Services ID (e.g. `com.happyhour.web`) is your `APPLE_SERVICE_ID`.

### 2d. Put the values in the right places

**Backend** — `backend/.env`:

```env
APPLE_SERVICE_ID=com.happyhour.web
APPLE_TEAM_ID=AB12CD34EF
```

Restart:

```bash
pm2 restart happyhour-backend
```

**Customer-app** — `customer-app/.env.production`:

```env
VITE_APPLE_SERVICE_ID=com.happyhour.web
VITE_APPLE_REDIRECT_URI=https://130.185.120.120:8443/login
```

Rebuild:

```bash
cd customer-app
npm run build
```

> Note: We're using Apple's JS SDK with `usePopup: true`, so the backend doesn't need an Apple private key (the .p8 file) — Apple's public keys are fetched from <https://appleid.apple.com/auth/keys> and the ID token is verified using them. The private key would only be required if you wanted to refresh Apple tokens server-side, which we don't.

---

## 3. How the flow works (so you can debug if something breaks)

### Google
1. User clicks the Google button → Google JS pops up.
2. User picks their account → Google JS calls `handleGoogleCredential(response)` with `response.credential` = a JWT ID token signed by Google.
3. Frontend POSTs `{ idToken }` to `POST /api/v1/auth/google`.
4. Backend uses `google-auth-library` to verify the token against `GOOGLE_CLIENT_ID` (audience check + signature check + expiry check).
5. Backend finds-or-creates the user (matched first by `googleId`, then by `email`), then issues normal Happy Hour access + refresh tokens.

### Apple
1. User clicks the Apple button → `AppleID.auth.signIn()` pops up.
2. Apple returns `data.authorization.id_token` (a JWT signed by Apple).
3. Frontend POSTs `{ idToken, fullName }` to `POST /api/v1/auth/apple`. (Apple only returns `fullName` the *first* time a user signs in, so we capture it and send it along.)
4. Backend fetches Apple's public keys, verifies the token (audience = `APPLE_SERVICE_ID`, issuer = `https://appleid.apple.com`), finds-or-creates the user, and issues access + refresh tokens.

### Failure cases you might hit

| Error                                             | Cause                                                                 | Fix                                                                          |
| ------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `Google sign-in not configured on this server`    | `GOOGLE_CLIENT_ID` is empty in `backend/.env`                         | Set it, then `pm2 restart happyhour-backend`                                 |
| `Apple sign-in not configured on this server`     | `APPLE_SERVICE_ID` empty in `backend/.env`                            | Set it, then `pm2 restart happyhour-backend`                                 |
| Google popup says "origin not allowed"            | Your current URL isn't in **Authorized JavaScript origins**           | Add it in Cloud Console                                                      |
| Apple popup says "invalid_client"                 | `APPLE_SERVICE_ID` doesn't match Services ID identifier               | Recheck both — case sensitive                                                |
| Apple popup says "invalid redirect URI"           | The return URL isn't in the Services ID's **Return URLs** list        | Add the exact URL there                                                      |
| Backend returns `Invalid Google token`            | Frontend's `VITE_GOOGLE_CLIENT_ID` != backend's `GOOGLE_CLIENT_ID`    | Set them to the same value, rebuild, restart                                 |
| Buttons say "(not configured)" in the UI          | `VITE_GOOGLE_CLIENT_ID`/`VITE_APPLE_SERVICE_ID` empty at build time  | Put them in `customer-app/.env.production` and `npm run build` again        |

---

## 4. Quick deploy checklist for the USA server

```bash
# on the server, inside the repo
git pull

# backend
cd backend
npm install        # picks up google-auth-library + jwks-rsa
# edit .env, paste GOOGLE_CLIENT_ID / APPLE_SERVICE_ID / APPLE_TEAM_ID
pm2 restart happyhour-backend

# customer-app
cd ../customer-app
# edit .env.production, paste VITE_GOOGLE_CLIENT_ID / VITE_APPLE_SERVICE_ID / VITE_APPLE_REDIRECT_URI
npm install
npm run build
# nginx is already serving customer-app/dist, no extra step needed
```

Open the customer app — the Google and Apple buttons should now light up at the top of the login screen.
