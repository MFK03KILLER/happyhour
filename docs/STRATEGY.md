# Happy Hour — Strategic Decisions

This document covers the three strategic questions raised: Apple Store fees, Square POS integration, and native app strategy.

---

## 1. Apple App Store 30% Fee — How to Avoid

Apple takes 30% (15% for the second year) on all in-app purchases on iOS. With a $4.99/month subscription, that's $1.50/month lost per subscriber. At 10,000 subscribers, that's **$15,000/month** to Apple — significant.

### Three options, ranked by recommendation

#### ✅ Option A: "Reader app" model (recommended)

**How it works:** users subscribe **on the web** (your own site). The iOS app is a "reader" that just lets them browse/claim coupons once they have an active subscription.

**Apple's rules (current as of 2026):**
- Reader apps are explicitly allowed (Netflix, Spotify, Kindle do this)
- You can show "Subscribe at happyhour.com" inside the app
- You **cannot** show a "Subscribe" button that takes them to your website (yet)
- New: with the [External Link Account Entitlement](https://developer.apple.com/support/storekit-external-entitlement/), you CAN link out — Apple takes 27% instead of 30%, so savings are minimal here

**What we'd implement:**
1. Web: `/subscribe` (Stripe/payment) — already mostly built
2. iOS app: shows "Members get 3 coupons/day. Manage your membership at happyhour.com"
3. No payment UI in the iOS app
4. Auth: same login works across web + iOS

**Trade-off:** Slightly worse conversion (users have to leave the app to subscribe). But it's the industry standard — Spotify, Netflix etc. all do this.

#### Option B: PWA-only (no native app)

Skip the iOS app entirely. Users add the PWA to their home screen.

**Pros:** 0% to Apple. Fastest deploy. Already working.
**Cons:** No App Store discoverability. Some iOS features limited (push notifications work on iOS 16.4+ for installed PWAs).

#### Option C: External Link Entitlement

Apple now allows linking to external payment (US/EU since 2024). You sell on web, get 27% instead of 30%, plus you pay payment processor fees.

**Math:** 30% Apple vs (27% Apple + 2.9% Stripe + $0.30) = ~30% either way for small transactions. **Not worth it** for $4.99 subs.

### Our recommendation

**Build it as a "reader app".** Subscription only on web. iOS/Android apps are for browsing + claiming.

---

## 2. Square POS Integration — How merchants reconcile

Many of our merchants will use Square (or Toast, Clover) for their cash register. When a customer redeems a Happy Hour coupon, the merchant needs to:
1. Apply the discount to the bill
2. Record it for accounting (tax, sales reporting)

### Three integration paths

#### ✅ Path A: Manual line-item (MVP, recommended to start)

**How it works:**
1. Customer shows their QR/6-digit code
2. Merchant scans QR with our app → sees "Buy 1 Get 1 Free — TGI Fridays"
3. Merchant manually adds a "Happy Hour Discount" line item in Square (with the discount amount)
4. Merchant types our 6-digit redemption code in Square's "note" field for the transaction
5. End of month, merchant exports Square transactions filtered by note → reconciles with our dashboard

**Pros:** Zero integration cost. Works with any POS. Ships immediately.
**Cons:** Manual work for merchant. Risk of human error.

**This is what we ship with.**

#### Path B: Square API integration (after we have 30+ merchants)

We integrate with Square's Connect API:

```
POST /v2/orders {
  "line_items": [...],
  "discounts": [{
    "name": "Happy Hour - BOGO Pizza",
    "type": "FIXED_AMOUNT",
    "amount_money": { "amount": 1599, "currency": "USD" },
    "metadata": { "happy_hour_code": "ABC123", "redemption_id": "..." }
  }]
}
```

**Workflow:**
1. Merchant scans QR in our app
2. Our backend calls Square API to add the discount to their *current open order*
3. Merchant just completes payment in Square as usual
4. Reconciliation is automatic (Square stores our metadata)

**Pros:** Auto-reconciled. Zero merchant work.
**Cons:** Each merchant must OAuth-connect their Square account. Some merchants don't use Square.

**Effort:** ~3 weeks (one engineer). Build after we have 30+ Square merchants asking.

#### Path C: Square App Marketplace (best UX, longest)

Build a Happy Hour app for Square's App Marketplace. Merchants install it from their Square dashboard. The app adds a "Happy Hour" button to the Square checkout flow. Tap it → enter customer code → discount auto-applied + recorded.

**Pros:** Best merchant UX. Discoverable in Square Marketplace.
**Cons:** Long approval process (~2 months). Requires Square's certification.

### Our recommendation

**Ship Path A (manual) now.** Build Path B when 30+ Square-using merchants request it.

### What we already have that helps

- ✅ Every redemption gets a unique mock transaction ID (`mock_xxx`)
- ✅ Admin dashboard shows all redemptions per merchant
- ✅ Audit log for accountants

### What we should add for Path A

- [ ] CSV export of merchant's redemptions for accounting
- [ ] Monthly summary email to merchant: "You had 47 redemptions worth $1,234 in discounts this month"
- [ ] Show the 6-digit code prominently when merchant scans (so they can type it into Square)

---

## 3. Native App Strategy — Build path

We need to ship on iOS App Store + Google Play Store. Three options:

### ✅ Option A: Capacitor wrapper (recommended)

Wrap the existing Vue 3 PWA with [Capacitor](https://capacitorjs.com/). 1-2 weeks of work.

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add ios
npx cap add android
npm run build
npx cap copy
npx cap open ios   # opens Xcode
npx cap open android  # opens Android Studio
```

**What you get:**
- Same Vue 3 codebase = single source of truth
- Native iOS + Android binaries
- Plugin access to camera, geolocation, push notifications, native maps
- App Store + Google Play distribution
- ~85% code reuse

**Trade-off:** Slightly less native feel than React Native. WebView-based — performance is good but not native.

### Option B: React Native rewrite

Rebuild the entire frontend in React Native. Native UI on both platforms.

**Pros:** True native feel. Better performance for complex screens.
**Cons:** 3-4 months of work. Need separate codebase from web. New tech stack.

### Option C: Flutter rewrite

Rebuild in Flutter (Dart language).

**Pros:** Best performance. Pixel-perfect UI consistency.
**Cons:** 4-6 months. Dart is a learning curve. Web support is mediocre.

### Our recommendation

**Capacitor — ship in 2 weeks.**

If after launch the user feedback is "the app feels slow/laggy", THEN rewrite the slowest screens in React Native (you can mix and match). But for a coupon app where browsing speed is fine and the core action is "show QR" (no perf concerns), Capacitor is more than enough.

### Roadmap to App Store

| Week | Task |
|---|---|
| 1 | Install Capacitor, add iOS+Android platforms, test on simulator |
| 1 | Add native plugins: camera (already works), geolocation (native API), push notifications |
| 1 | Add splash screens, app icons, native loading |
| 2 | App Store assets: screenshots, marketing description, privacy policy |
| 2 | Apple Developer account setup ($99/year), App Store Connect submission |
| 2 | Google Play Console setup ($25 one-time), Play Store submission |

**Total cost:** $99 (Apple) + $25 (Google) + 1-2 engineering weeks.

---

## Summary

| Decision | Recommendation |
|---|---|
| Apple 30% | Build as a **reader app**. Subscription only on web. |
| Square POS | **Manual line-item** for now. API integration after 30+ Square merchants. |
| Native app | **Capacitor** wrapper. 2 weeks to ship on both stores. |

When ready to execute any of these, ping me with the green light and we'll implement.
