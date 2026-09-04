# Data safety — complete answers for both apps

Each data type you tick opens the same page with 4 questions. The tables below give
every answer. Anything not listed: **do not tick it at all.**

---

# 1) CUSTOMER APP — `app.happyhour.customer`

Tick exactly these **9** data types. Nothing else.

| # | Category | Data type | Collected | Shared | Ephemeral? | Required or optional | Purposes |
|---|---|---|---|---|---|---|---|
| 1 | Personal info | Name | ✅ Yes | ❌ No | **No** | **Required** | App functionality · Account management |
| 2 | Personal info | Email address | ✅ Yes | ❌ No | **No** | **Required** | App functionality · Account management |
| 3 | Personal info | User IDs | ✅ Yes | ❌ No | **No** | **Required** | App functionality · Account management |
| 4 | Personal info | Phone number | ✅ Yes | ❌ No | **No** | **Optional** | App functionality · Account management |
| 5 | Personal info | Address | ✅ Yes | ❌ No | **No** | **Optional** | App functionality |
| 6 | Financial info | Purchase history | ✅ Yes | ❌ No | **No** | **Required** | App functionality |
| 7 | Location | Approximate location | ✅ Yes | ❌ No | **No** | **Optional** | App functionality |
| 8 | Location | Precise location | ✅ Yes | ❌ No | **No** | **Optional** | App functionality |
| 9 | App activity | In-app search history | ✅ Yes | ❌ No | **Yes** | **Optional** | App functionality |

**Do NOT tick, anywhere:**
`User payment info` · `Credit score` · `Other financial info` · `Race and ethnicity` ·
`Political or religious beliefs` · `Sexual orientation` · `Other personal info` ·
`App interactions` · `Installed apps` · `Other user-generated content` · `Other actions` ·
`Health and fitness` · `Messages` · `Photos and videos` · `Audio files` · `Files and docs` ·
`Calendar` · `Contacts` · `Web browsing history` · `Crash logs` · `Diagnostics` ·
`Other app performance data` · `Device or other IDs`

---

# 2) MERCHANT APP — `app.happyhour.merchant`

Tick exactly these **4**. Nothing else.

| # | Category | Data type | Collected | Shared | Ephemeral? | Required or optional | Purposes |
|---|---|---|---|---|---|---|---|
| 1 | Personal info | Name | ✅ Yes | ❌ No | **No** | **Required** | App functionality · Account management |
| 2 | Personal info | Email address | ✅ Yes | ❌ No | **No** | **Required** | App functionality · Account management |
| 3 | Personal info | User IDs | ✅ Yes | ❌ No | **No** | **Required** | App functionality · Account management |
| 4 | Personal info | Phone number | ✅ Yes | ❌ No | **No** | **Optional** | App functionality · Account management |

**Do NOT tick anything else** — no location (this app has no location permission),
no purchase history (staff buy nothing), no photos/videos (the camera decodes the QR
code in memory and no image ever leaves the device).

---

# 3) Security practices page — identical for both apps

| Question | Answer |
|---|---|
| Is all of the user data collected by your app encrypted in transit? | **Yes** |
| Do you provide a way for users to request that their data is deleted? | **Yes** |
| Deletion request URL | `https://happyhourz.org/delete-account` |
| Independently validated against a global security standard? | **No** (leave unchecked) |

---

# 4) What the store listing should say when you are done

```
Data shared
  No data shared with third parties

Data collected
  Personal info    Name, Email address, User IDs, Address, Phone number
  Financial info   Purchase history
  Location         Approximate location, Precise location
```

`In-app search history` is correctly absent — data marked ephemeral must still be
declared but is not shown on the listing.

If "Data shared" is not empty, go back: **Shared** was ticked instead of **Collected**.

---

# 5) Why each answer — verified in the code, not guessed

| Answer | Evidence |
|---|---|
| Name, Email required | `registerSchema`: `email` and `fullName` are mandatory |
| Phone optional | `registerSchema`: `phone: z.string().optional()` |
| Address optional, not ephemeral | `User.addresses[]` persists street/city/zip/lat/lng |
| Precise location **not** ephemeral | `Addresses.vue:42-45` — "Use my current location" writes the device coords into a saved address, which is stored |
| Location collected at all | `Home.vue` / `Browse.vue` send `params.lat` / `params.lng` to `/customer/discover` |
| Search history **is** ephemeral | `Browse.vue:29` sends `search` as a query param; the backend only filters with it and never stores it |
| Purchase history required | `Payment` records are written on every purchase with no opt-out |
| `User payment info` NOT collected | Card details are typed on Stripe's hosted checkout page and never reach our server; only `brand` + `last4` come back |
| Nothing "Shared" | Stripe is a service provider processing on our behalf — Google's own definition excludes that from sharing |
| No crash/analytics/ad data | no Firebase, Crashlytics, Sentry, GA, Mixpanel, Amplitude or advertising ID in either app |

---

# 6) Known, harmless

The customer app declares `POST_NOTIFICATIONS` and ships `@capacitor/push-notifications`,
but no code calls it — push is not wired up. It is a normal (non-sensitive) permission,
does not block release, and keeping it means push can be switched on later without a new
native release. Nothing to declare for it in Data safety.
