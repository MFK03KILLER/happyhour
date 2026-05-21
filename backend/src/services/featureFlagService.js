const flagRepo = require('../repositories/featureFlagRepository');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');

const REGISTRY = [
  { key: 'surprise_bag', label: 'Surprise Bags', description: 'Pay-per-item leftover/last-minute offers, no subscription required.', group: 'offers', sortOrder: 1 },
  { key: 'subscription_tiers', label: 'Subscription Tiers', description: 'Multiple plan tiers (Lite/Plus/Pro) instead of single $4.99 plan.', group: 'offers', sortOrder: 2 },
  { key: 'maps', label: 'Maps view', description: 'In-app map of nearby merchants and "Open in Maps" deep links.', group: 'discovery', sortOrder: 3 },
  { key: 'push_notifications', label: 'PWA Push Notifications', description: 'Web Push notifications for new offers nearby.', group: 'engagement', sortOrder: 4 },
  { key: 'delivery', label: 'Delivery option', description: 'Allow merchants to deliver surprise bags. Requires surprise_bag.', group: 'offers', sortOrder: 5 },
  { key: 'redemption_code', label: '6-digit redemption code', description: 'Manual code entry alongside QR scanning at merchant.', group: 'redemption', sortOrder: 6 },
  { key: 'referral_program', label: 'Referral program', description: 'Give $5 / get $5 invite friends program.', group: 'engagement', sortOrder: 7 },
];

async function syncRegistry() {
  for (const def of REGISTRY) {
    const existing = await flagRepo.findByKey(def.key);
    if (existing) {
      existing.label = def.label;
      existing.description = def.description;
      existing.group = def.group;
      existing.sortOrder = def.sortOrder;
      await existing.save();
    } else {
      await flagRepo.upsert(def.key, { ...def, enabled: false });
    }
  }
}

async function list() {
  await syncRegistry();
  return flagRepo.list();
}

async function publicMap() {
  const flags = await flagRepo.publicList();
  const map = {};
  flags.forEach((f) => { map[f.key] = f.enabled; });
  return map;
}

async function setEnabled(key, enabled) {
  const updated = await flagRepo.update(key, { enabled: !!enabled });
  if (!updated) throw new NotFoundError('Flag not found');
  return updated;
}

async function requireEnabled(key) {
  const ok = await flagRepo.isEnabled(key);
  if (!ok) throw new ForbiddenError(`Feature "${key}" is disabled`);
}

module.exports = { list, publicMap, setEnabled, requireEnabled, syncRegistry, REGISTRY };
