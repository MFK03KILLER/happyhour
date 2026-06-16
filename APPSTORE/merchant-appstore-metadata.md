# App Store Connect — Merchant app ("Happy Hour Merchant")

Copy each field into App Store Connect. Primary language: **English (U.S.)**.
This is a **B2B companion app** for partner venues — Apple allows it as a separate app (not a 4.3 duplicate) because it serves a different audience with different functionality.

---

## App information

| Field | Value | Limit |
|-------|-------|-------|
| **App Name** | `Happy Hour Merchant` | ≤30 (19) |
| **Subtitle** | `Scan & redeem coupons` | ≤30 (21) |
| **Bundle ID** | `app.happyhour.merchant` | — |
| **SKU** | `happyhour-merchant-001` | — |
| **Primary Category** | Business | — |
| **Secondary Category** | (none) | — |
| **Copyright** | `© 2026 <Your Legal Entity>` | — |

---

## Promotional Text (≤170)
```
The partner console for Happy Hour venues: scan customer QR codes to redeem coupons, manage your offers, and track redemptions — all from your phone.
```

## Description (≤4000)
```
Happy Hour Merchant is the companion app for restaurants, cafés, and venues that partner with Happy Hour.

FOR YOUR STAFF
• Scan customer QR codes at the counter to redeem coupons in seconds
• See exactly what each customer is entitled to before you apply it
• Works at the register, fast and reliable

FOR OWNERS & MANAGERS
• Create and manage your deals and offers
• Track redemptions and customer engagement
• Manage multiple locations and team members

This app is for Happy Hour partner businesses only. To become a partner, contact us through the Happy Hour website.
```

## Keywords (≤100, comma-separated, NO spaces)
```
merchant,redeem,scan,qr,coupons,pos,business,restaurant,partner,console,deals
```

## URLs (must be LIVE before submit)
- **Support URL** (required): `https://YOUR-DOMAIN.com/support`
- **Privacy Policy URL** (required): `https://YOUR-DOMAIN.com/privacy`

---

## Age Rating
- All categories **None** → **4+**.

---

## App Privacy
| Data type | Purpose | Linked? | Tracking? |
|-----------|---------|---------|-----------|
| Name (staff/merchant) | App Functionality, Account | Yes | No |
| Email / Phone | App Functionality, Account | Yes | No |
| User ID | App Functionality | Yes | No |
| Usage Data / Diagnostics | Analytics | No | No |

- **No precise location**, **no consumer PII**.
- Camera is used **on-device** to scan QR codes and is **not** collected/stored → declare nothing for camera (it's a permission, not "data collection") unless you upload images.

---

## App Review Information (Guideline 2.1 — demo account)
- **Sign-in required:** Yes
- **User name / Password:** a REAL demo merchant account with **sample deals and some redemption history** (NOT an empty shell → avoids 4.2 rejection).
  - e.g. `merchant.reviewer@happyhour.app` / `Review#2026`
- **Notes:**
```
Happy Hour Merchant is the B2B companion app for partner venues. It lets staff scan customer QR codes to redeem coupons at the counter, and lets owners create deals and view redemptions.

Demo login: merchant.reviewer@happyhour.app / Review#2026 (this account has sample deals and redemption history).

Camera permission is used solely for scanning customer QR codes at the counter. This app has a separate audience from the consumer "Happy Hour" app.
```

## Version Release "What's New" (first version)
```
Welcome to Happy Hour Merchant! Scan customer QR codes to redeem coupons, manage your deals, and track redemptions.
```
