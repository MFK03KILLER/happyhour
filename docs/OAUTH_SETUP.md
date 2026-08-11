# Google Sign-In Setup

This explains **exactly where each value goes** so "Continue with Google" works end-to-end.

> Apple Sign-In has been removed from the app. Only Google remains.

There is **one** credential: a **Google OAuth Client ID**. The same value goes in two places and they must match:

| Value | Where you create it | Backend | Customer app |
| ----- | ------------------- | ------- | ------------ |
| Google OAuth Client ID | Google Cloud Console | `backend/.env` → `GOOGLE_CLIENT_ID` | `customer-app/.env.production` → `VITE_GOOGLE_CLIENT_ID` |

The frontend uses it to ask Google for an ID token; the backend uses it to verify that same token was meant for our app.

---

## 1. Create the OAuth Client ID

1. Go to <https://console.cloud.google.com/apis/credentials>.
2. Pick (or create) a project, e.g. **Happy Hour**.
3. Configure the **OAuth consent screen** once:
   - User type: **External**
   - App name: **Happy Hour**, your email as developer contact
   - Scopes: `email`, `profile`, `openid`
   - While still in "Testing" mode, add your own Google account under **Test users** (or click **Publish app** to allow anyone).
4. Back on **Credentials** → **Create credentials** → **OAuth client ID**.
5. Application type = **Web application**. Name: `Happy Hour Customer App`.
6. Under **Authorized JavaScript origins**, add every origin the frontend runs on:
   - `https://happyhourz.org`
   - `https://www.happyhourz.org`
   - `http://localhost:5173` (local dev, optional)
7. **Authorized redirect URIs** — leave empty (we use the Google Identity Services popup flow, no redirect).
8. Click **Create** and copy the **Client ID** — it looks like
   `1234567890-abcdefg.apps.googleusercontent.com`.

---

## 2. Put the Client ID in the two places

### Backend — `/var/www/happyhour/backend/.env`

```env
GOOGLE_CLIENT_ID=1234567890-abcdefg.apps.googleusercontent.com
```

Restart the API:

```bash
pm2 restart happyhour-api
```

### Customer app — `/var/www/happyhour/customer-app/.env.production`

```env
VITE_API_BASE=/api/v1
VITE_GOOGLE_CLIENT_ID=1234567890-abcdefg.apps.googleusercontent.com
```

Vite bakes `VITE_*` vars into the bundle at build time, so you must rebuild:

```bash
cd /var/www/happyhour/customer-app
npm run build
```

Nginx already serves `customer-app/dist`, so no nginx change is needed. Reload the site — the
**Continue with Google** button lights up at the top of the login screen. (When
`VITE_GOOGLE_CLIENT_ID` is empty, the UI shows a disabled "Google (not configured)" button.)

---

## 3. How the flow works (for debugging)

1. User clicks the Google button → Google JS popup.
2. User picks their account → Google calls `handleGoogleCredential(response)` with
   `response.credential` = a JWT ID token signed by Google.
3. Frontend `POST /api/v1/auth/google` with `{ idToken }`.
4. Backend verifies it with `google-auth-library` against `GOOGLE_CLIENT_ID`
   (audience + signature + expiry), finds-or-creates the user (matched by `googleId`, then
   `email`), and issues Happy Hour access + refresh tokens.

### Common errors

| Error | Cause | Fix |
| ----- | ----- | --- |
| `Google sign-in not configured on this server` | `GOOGLE_CLIENT_ID` empty in `backend/.env` | Set it, then `pm2 restart happyhour-api` |
| Google popup: "origin is not allowed" | Current URL not in **Authorized JavaScript origins** | Add `https://happyhourz.org` in Cloud Console |
| Backend returns `Invalid Google token` | Frontend `VITE_GOOGLE_CLIENT_ID` ≠ backend `GOOGLE_CLIENT_ID` | Make them identical, rebuild the frontend, restart the API |
| Button says "Google (not configured)" | `VITE_GOOGLE_CLIENT_ID` empty at build time | Put it in `.env.production` and `npm run build` again |

---

## 4. Quick deploy checklist

```bash
cd /var/www/happyhour && git pull

# backend
cd backend && npm install
# edit .env → set GOOGLE_CLIENT_ID
pm2 restart happyhour-api

# customer app
cd ../customer-app
# edit .env.production → set VITE_GOOGLE_CLIENT_ID
npm install && npm run build
```
