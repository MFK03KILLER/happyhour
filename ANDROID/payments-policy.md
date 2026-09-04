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

**Tick exactly one box, for both apps:**

> **Purchase agreements → Rewards, points, frequent flier miles, and other incentives**

That is what a paid discount/deals membership is.

**Leave every other box unticked**, and do **not** choose "My app doesn't provide any
financial features":

| Not applicable | Why |
|---|---|
| Banking, loans, payday loans, line of credit, earned wage advances, microfinance | we lend nothing |
| **Mobile payments and digital wallets** | this is for apps whose *product* is a wallet or payment service. Charging for our own membership does not make us one. |
| Money transfer and wire services | we move no money between users |
| Buy now, pay later | one up-front charge only |
| Crypto wallet / exchange / NFT / stock trading / crowdfunding / prediction markets | none present |
| Credit monitoring, financial advice, insurance | none present |
| Other | already covered by the Rewards box |

### Merchant app

The merchant app sells nothing — staff only scan codes and view stats. Tick the same
**Rewards, points... and other incentives** box, since it operates the same incentives
programme from the venue side.
