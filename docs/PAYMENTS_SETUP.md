# Payments Setup (Stripe)

The app ships in **mock mode** — subscriptions and surprise-bag purchases are recorded
with a fake `mock_...` transaction id and **no real money moves**. This is the current
live behaviour. When you're ready to take real cards, connect **Stripe** by adding keys.
Nothing else in the code needs to change — setting `STRIPE_SECRET_KEY` automatically flips
the app into Stripe mode.

Why Stripe (vs Square): no monthly fee (Square Billing is $20/mo), the best subscription
APIs, and the standard for SF startups. Both charge ~2.9% + 30¢ per transaction.

---

## 1. Create a Stripe account + get your keys

1. Sign up at <https://dashboard.stripe.com/register>.
2. **Developers → API keys**. Copy:
   - **Secret key** — `sk_live_...` (or `sk_test_...` while testing)
   - **Publishable key** — `pk_live_...` (or `pk_test_...`)
3. Keep the secret key private — it goes only on the server, never in the frontend bundle.

---

## 2. Add the keys on the server

### Backend — `/var/www/happyhour/backend/.env`

```env
APP_BASE_URL=https://happyhourz.org
PAYMENTS_PROVIDER=stripe          # optional — auto-set to 'stripe' once the secret key is present
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx   # from step 3 below
```

Install the SDK (first time only) and restart:

```bash
cd /var/www/happyhour/backend
npm install                 # pulls in the `stripe` package
pm2 restart happyhour-api
```

### Customer app — `/var/www/happyhour/customer-app/.env.production`

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxx
```

Rebuild the frontend so the Subscribe screen switches from the mock sheet to real
Stripe Checkout:

```bash
cd /var/www/happyhour/customer-app
npm run build
```

---

## 3. Configure the webhook (so subscriptions activate after payment)

Payment is confirmed asynchronously by Stripe, so the backend listens for a webhook.

1. In Stripe: **Developers → Webhooks → Add endpoint**.
2. Endpoint URL: `https://happyhourz.org/api/v1/payments/webhook`
3. Events to send: **`checkout.session.completed`**
4. Save, then copy the endpoint's **Signing secret** (`whsec_...`) into
   `STRIPE_WEBHOOK_SECRET` in `backend/.env` and `pm2 restart happyhour-api`.

Nginx already proxies `/api/` to the backend, so no nginx change is needed.

---

## 4. How the flow works

1. Customer picks a plan (and optionally a promo code) → taps **Get …**.
2. Frontend calls `POST /api/v1/customer/subscription/checkout` → backend creates a Stripe
   Checkout Session for the (discounted) amount and returns its URL.
3. Customer is redirected to Stripe's hosted checkout, pays, and is returned to
   `https://happyhourz.org/subscribe?checkout=success`.
4. Stripe calls our webhook → `checkout.session.completed` → the backend records the
   payment, marks the promo code as redeemed, and activates the subscription.

We charge the plan price **once per period** (Stripe Checkout in `mode: payment`); the app's
own `Subscription` document tracks the billing period (30 / 365 days). Recurring
auto-renew via Stripe Billing can be layered on later if desired.

> **Surprise-bag purchases** still use the mock path for now; only the subscription flow is
> wired to Stripe. Ask to extend it when needed.

---

## 5. Testing with test keys

Use `sk_test_...` / `pk_test_...` and Stripe's test card `4242 4242 4242 4242`, any future
expiry, any CVC. Use the Stripe CLI to forward webhooks to a local server:

```bash
stripe listen --forward-to localhost:4000/api/v1/payments/webhook
```

To go back to mock mode, blank out `STRIPE_SECRET_KEY` (or set `PAYMENTS_PROVIDER=mock`) and
restart the API.
