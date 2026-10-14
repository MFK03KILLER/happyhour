// One-time Stripe go-live setup, run on the server after STRIPE_SECRET_KEY is in .env:
//   node scripts/stripe-setup.js [pk_live_...]
// - checks the key and prints the account's status (never any secret)
// - (re)creates the webhook endpoint for this site and stores its signing
//   secret as STRIPE_WEBHOOK_SECRET in .env
// - stores the publishable key if one is passed
// Then: pm2 restart happyhour-api --update-env
const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '..', '.env');
const WEBHOOK_URL = 'https://happyhourz.org/api/v1/payments/webhook';
const EVENTS = ['checkout.session.completed'];

function setEnv(text, key, value) {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  return re.test(text) ? text.replace(re, line) : `${text.replace(/\n?$/, '\n')}${line}\n`;
}

(async () => {
  require('dotenv').config({ path: ENV_FILE });
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !/^sk_(live|test)_/.test(key)) throw new Error('STRIPE_SECRET_KEY is missing from .env');
  const stripe = require('stripe')(key, { apiVersion: '2024-06-20' });

  const acct = await stripe.accounts.retrieve();
  console.log(`mode: ${key.startsWith('sk_live_') ? 'LIVE' : 'test'}`);
  console.log(`account: ${acct.settings?.dashboard?.display_name || acct.business_profile?.name || acct.id} (${acct.country}, ${acct.default_currency})`);
  console.log(`charges_enabled: ${acct.charges_enabled}  payouts_enabled: ${acct.payouts_enabled}`);
  try {
    const cfgs = await stripe.paymentMethodConfigurations.list({ limit: 5 });
    const cfg = cfgs.data.find((c) => c.is_default) || cfgs.data[0];
    if (cfg) console.log(`apple_pay: ${cfg.apple_pay?.display_preference?.value}  google_pay: ${cfg.google_pay?.display_preference?.value}`);
  } catch { console.log('wallet settings: not readable with this key'); }

  // A signing secret is only shown when an endpoint is created, so replace ours.
  const existing = await stripe.webhookEndpoints.list({ limit: 100 });
  for (const ep of existing.data.filter((e) => e.url === WEBHOOK_URL)) {
    await stripe.webhookEndpoints.del(ep.id);
    console.log(`removed old webhook ${ep.id}`);
  }
  const ep = await stripe.webhookEndpoints.create({
    url: WEBHOOK_URL,
    enabled_events: EVENTS,
    api_version: '2024-06-20',
    description: 'Happy Hour memberships',
  });
  console.log(`webhook created: ${ep.id} -> ${WEBHOOK_URL}`);

  let env = fs.readFileSync(ENV_FILE, 'utf8');
  env = setEnv(env, 'STRIPE_WEBHOOK_SECRET', ep.secret);
  const pk = process.argv[2];
  if (pk) {
    if (!/^pk_(live|test)_/.test(pk)) throw new Error('second argument must be a publishable key');
    env = setEnv(env, 'STRIPE_PUBLISHABLE_KEY', pk);
  }
  fs.writeFileSync(ENV_FILE, env, { mode: 0o600 });
  console.log('saved to .env: STRIPE_WEBHOOK_SECRET' + (pk ? ', STRIPE_PUBLISHABLE_KEY' : ''));
})().catch((e) => { console.error('stripe-setup failed:', e.message); process.exit(1); });
