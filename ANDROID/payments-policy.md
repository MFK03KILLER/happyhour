# Payments: why Stripe is allowed, and the Financial features form

---

# 1) Do we have to use Google Play Billing? — No.

Google Play requires **Google Play Billing** only for *digital* goods and content that
are consumed **inside** the app (game currency, premium filters, an ad-free tier, a
streaming subscription).

It explicitly does **not** apply to payment for **physical goods, or services performed
in the real world**. Google's own examples include ride-hailing, food ordering and
delivery, event tickets, gym memberships and in-person services. Those apps use Stripe,
Adyen, Braintree etc. and pay Google nothing.

Happy Hour is squarely in the second group:

| What the member pays for | Where it is consumed |
|---|---|
| Membership → discounts at partner venues | **In person**, at a physical restaurant/cafe/bar. Staff scan a QR code at the counter. |
| Surprise bags | **Physical food**, collected at the venue |
| Delivery orders | **Physical food**, delivered to an address |

Nothing we sell is consumed inside the app. So:

- ✅ Stripe is allowed
- ✅ **No Google Play service fee** on any of it (no 15%, no 30%)
- ✅ No Google Play Billing library needs to be integrated

For reference, if the app *were* classed as digital content, the fee would be 15% on
subscriptions and 15% on the first $1M of one-time purchases per year (30% above that).
None of that applies here.

---

# 2) The one real risk, and how to remove it

A reviewer skim-reading "subscription that unlocks coupons in an app" could mistake it
for digital content. The way to prevent that is to make the real-world redemption
obvious wherever a reviewer looks:

- The store listing already says the coupon is shown at the counter and **the staff scans it**
- The App access instructions already say the QR code is what venue staff scan
- The paywall / subscribe screen should describe the benefit as discounts **at partner
  venues**, never as "unlock premium content" or "unlock the app"

If Google ever asks, this is the answer:

```
Happy Hour is a membership for discounts at physical restaurants, cafes and bars in
the San Francisco Bay Area. Members redeem offers in person: the venue's staff scan a
QR code at the counter to apply the discount. Surprise bags and delivery orders are
physical food. No digital goods or in-app content are sold, so under Google Play's
Payments policy these are payments for physical goods and real-world services, which
are exempt from Google Play Billing.
```

---

# 3) "Financial features in your app" form

**For BOTH apps, select:**

> **My app doesn't provide any financial features**

**Leave every other box on the page unticked.**

## This was wrong before, and it caused a rejection

An earlier version of this file said to tick *Purchase agreements → Rewards, points,
frequent flier miles, and other incentives*. That is what got `app.happyhour.customer`
rejected:

> Some types of apps can only be distributed by organizations. You have selected an app
> category or declared your app offers certain features that require you to submit your
> app using an organization account.

Since 31 August 2024, a **new personal** developer account cannot publish an app that
declares it provides **financial products or services**. Ticking anything in the
Financial features form puts the app in that bucket. The four categories that force an
organization account are:

- Financial products and services (banking, loans, stock trading, investment funds,
  crypto wallets and exchanges)
- Health apps
- Apps using `VpnService`
- Government apps

## Why "no financial features" is the accurate answer

Happy Hour is none of those. It sells a **discount membership for meals eaten in
person**. There is no stored value, no points balance, no account holding money, no
lending, no transfer between users. Charging for your own non-financial service through
Stripe does not make the app a financial service — otherwise every shop with a
subscription would be one.

| Box | Why not |
|---|---|
| Rewards, points, frequent flier miles and other incentives | for programmes with an accumulating balance that carries value. Happy Hour has no points and no balance — you pay, you get a discount at the counter. |
| Mobile payments and digital wallets | for apps whose *product* is a wallet or payment service |
| Money transfer and wire services | no money moves between users |
| Buy now, pay later | one up-front charge |
| Banking, loans, credit line, payday, microfinance | nothing is lent |
| Crypto, NFT, stock trading, crowdfunding, prediction markets | none present |
| Credit monitoring, financial advice, insurance | none present |

## How to fix a rejection caused by this

1. `Policy → App content → Financial features → Manage`
2. Untick everything, select **My app doesn't provide any financial features**, save
3. Check the merchant app has the same answer
4. `Publishing overview → Send changes for review`

Do not file an appeal — an appeal takes up to 7 days and the declaration really was
wrong. Correcting it and resubmitting is faster.
