# Data safety form — answers

Verified against the real code, not guessed:

| Claim | Evidence |
|---|---|
| Name / email / phone collected | `User.fullName` (required), `User.email` (required), `User.phone` (optional) |
| Address collected | `User.addresses[]` (street, city, zip, lat, lng, phone) — `/profile/addresses` is **not** gated by the delivery flag, so it is reachable today |
| Location transmitted | `Browse.vue` / `Home.vue` send `params.lat` / `params.lng` to `/customer/discover` |
| Location not stored | discovery only sorts by distance; nothing is persisted |
| Purchase history collected | `Payment` model (amount, method, status, context) |
| Card number NOT collected | Stripe Checkout is a hosted page; only `last4` + `brand` come back |
| No analytics / crash SDK | no Firebase, Crashlytics, Sentry, GA, Mixpanel, Amplitude in either app |
| No ad / device ID | nothing reads an advertising ID |
| Camera does not collect photos | `@zxing/browser` decodes the QR in-memory; no image leaves the device |

---

# 1) Customer app — `app.happyhour.customer`

**"Does your app collect or share any of the required user data types?" → Yes**

For every row below: **Collected = Yes**, **Shared = No**, **Processed ephemerally = No**
(except where noted), **Purposes = App functionality + Account management**.

### Personal info
| Data type | Collect | Required/Optional | Purposes |
|---|---|---|---|
| Name | ✅ | Required | App functionality, Account management |
| Email address | ✅ | Required | App functionality, Account management |
| Phone number | ✅ | Optional | App functionality, Account management |
| Physical address | ✅ | Optional | App functionality |
| User IDs | ✅ | Required | App functionality, Account management |
| Race/ethnicity, Political/religious beliefs, Sexual orientation, Other info | ❌ | | |

### Financial info
| Data type | Collect | Notes |
|---|---|---|
| Purchase history | ✅ Required | App functionality |
| **Payment info** | ❌ | Card details are entered on Stripe's own hosted checkout page and never reach our server. We store only card brand + last 4 digits. |
| Credit score, Other financial info | ❌ | |

### Location
| Data type | Collect | Required/Optional | Purposes |
|---|---|---|---|
| Approximate location | ✅ | Optional | App functionality |
| Precise location | ✅ | Optional | App functionality |

> The manifest declares `ACCESS_FINE_LOCATION` + `ACCESS_COARSE_LOCATION`, and reviewers
> cross-check the manifest against this form. Declare both even though the coordinates
> are only used to sort venues by distance and are never stored.

### App activity
| Data type | Collect | Required/Optional | Purposes |
|---|---|---|---|
| In-app search history | ✅ | Optional | App functionality |
| App interactions, Installed apps, Other user-generated content, Other actions | ❌ | | |

### Everything else → ❌
Messages · Photos and videos · Audio · Files and docs · Calendar · Contacts ·
Health and fitness · Web browsing history · **App info and performance**
(no crash-log or diagnostics SDK) · **Device or other IDs** (no advertising ID)

---

# 2) Merchant app — `app.happyhour.merchant`

**→ Yes**

### Personal info
| Data type | Collect | Required/Optional | Purposes |
|---|---|---|---|
| Name | ✅ | Required | App functionality, Account management |
| Email address | ✅ | Required | App functionality, Account management |
| Phone number | ✅ | Optional | App functionality, Account management |
| User IDs | ✅ | Required | App functionality, Account management |

### Everything else → ❌
No location permission in this app. The camera is used **only** to decode a QR code
in memory — no photo or video is collected, stored or transmitted. No purchase history
(staff do not buy anything in this app). No analytics, crash or ad SDKs.

---

# 3) Security practices — same answers for both apps

| Question | Answer |
|---|---|
| Is all of the user data collected by your app encrypted in transit? | **Yes** — the API is HTTPS/TLS only |
| Do you provide a way for users to request that their data is deleted? | **Yes** |
| Deletion request URL | `https://happyhourz.org/delete-account` |
| Has your app been independently validated against a global security standard? | **No** — leave unchecked |

---

# 4) One thing worth fixing

The customer app declares `POST_NOTIFICATIONS` and ships `@capacitor/push-notifications`,
but **no code calls it** — push is not wired up. It is a normal (non-sensitive)
permission so it will not block the release, and keeping it means push can be turned on
later without a fresh native release. Removing it would need a new store release to add
back. Either choice is fine; just know it is there and unused.
