# App Store Connect — Customer app ("Happy Hour")

Copy each field into App Store Connect. Char limits are hard (App Store rejects over-limit).
Primary language: **English (U.S.)**. Add other localizations later if you want.

---

## App information

| Field | Value | Limit |
|-------|-------|-------|
| **App Name** | `Happy Hour: Dining Deals` | ≤30 (24) |
| **Subtitle** | `Local coupons & rewards` | ≤30 (23) |
| **Bundle ID** | `app.happyhour.customer` | — |
| **SKU** | `happyhour-customer-001` | — |
| **Primary Category** | Food & Drink | — |
| **Secondary Category** | Shopping | — |
| **Copyright** | `© 2026 <Your Legal Entity>` | — |

> ⚠️ "Happy Hour" alone is likely taken / too generic. Use a distinctive App Name (e.g. `Happy Hour: Dining Deals`). The name must be unique on the App Store.

---

## Promotional Text (≤170, editable anytime without a new build)
```
New restaurants added weekly. One membership unlocks BOGO meals, free coffee, and half-price entertainment at hundreds of local spots near you.
```

## Description (≤4000)
```
Happy Hour is the friendliest way to save at the restaurants, cafés, and entertainment spots you already love. One simple membership unlocks real, everyday discounts — no coupon hunting, no fine print.

WHY HAPPY HOUR
• Up to 50% off — BOGO meals, free coffee, half-price activities
• One membership, hundreds of local partners
• Hand-picked spots, curated by locals
• Secure, rotating QR codes — show, scan, save

HOW IT WORKS
1. Browse deals near you on the map or in the feed
2. Claim the offer you want
3. Show your rotating QR code at the counter — the merchant scans it and your discount is applied instantly

MEMBERSHIP
A single subscription unlocks the full catalog of member discounts at participating venues. Cancel anytime from your profile.

SURPRISE BAGS
Grab discounted "surprise bags" of fresh food that restaurants would otherwise waste — pay in the app, pick it up in person.

Built for real life, not Black Friday. Download Happy Hour and start saving this week.
```

## Keywords (≤100 total, comma-separated, NO spaces)
```
deals,coupons,dining,restaurant,rewards,discount,food,cafe,savings,bogo,membership,local,offers
```

## URLs (must be LIVE & reachable before submit)
- **Support URL** (required): `https://YOUR-DOMAIN.com/support`  (template: `APPSTORE/support-page-TEMPLATE.md`)
- **Marketing URL** (optional): `https://YOUR-DOMAIN.com`
- **Privacy Policy URL** (required): `https://YOUR-DOMAIN.com/privacy`  (template: `APPSTORE/privacy-policy-TEMPLATE.md`)

---

## Age Rating (questionnaire)
- All content categories: **None**
- Unrestricted web access: **No**
- → Expected rating: **4+** (or 12+ if you later add user reviews with unmoderated UGC).

---

## App Privacy (data collection questionnaire)
Declare these (each: collected = Yes, NOT used for tracking, Linked to identity):

| Data type | Purpose | Linked to user? | Tracking? |
|-----------|---------|-----------------|-----------|
| Name | App Functionality, Account | Yes | No |
| Email address | App Functionality, Account | Yes | No |
| Phone number | App Functionality, Account | Yes | No |
| Precise Location | App Functionality (nearby deals) | Yes | No |
| User ID | App Functionality | Yes | No |
| Purchase history | App Functionality | Yes | No |
| Product interaction / Usage Data | Analytics | Yes | No |
| Crash / Diagnostics | Analytics | No | No |

- **"Used to track you": NO** (only if you do NOT add an ad/tracking SDK). If you ever add one, you must show the ATT prompt.
- ⚠️ Must include data collected by third-party SDKs too (e.g. Google Sign-In) — not only your own backend.

---

## App Review Information (Guideline 2.1 — demo account)
- **Sign-in required:** Yes
- **User name / Password:** provide a REAL working account **that already has an active paid membership** so the reviewer sees the unlocked catalog.
  - e.g. `reviewer@happyhour.app` / `Review#2026` (create it in your backend before submitting)
- **Notes:**
```
Happy Hour is a dining-benefits membership and marketplace for the U.S. market.

Demo login: reviewer@happyhour.app / Review#2026 (this account has an active membership, so the discount catalog is fully unlocked).

The membership unlocks access to real-world, in-person dining benefits redeemed at partner restaurants. "Surprise Bags" are physical food items purchased for in-person pickup at a real restaurant; per Guideline 3.1.3(e) these are physical goods consumed outside the app and use Apple Pay / credit card (not IAP).

Account deletion: Profile → Delete Account (in-app).

A separate "Happy Hour Merchant" app (different bundle ID, B2B audience) is the partner-venue redemption console.
```

## Version Release "What's New" (first version)
```
Welcome to Happy Hour! Browse local dining deals, claim member offers, and redeem with a secure QR code at the counter.
```
