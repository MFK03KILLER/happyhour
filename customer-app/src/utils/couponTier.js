// Coupons can be limited to a plan and up (pre-Nov-2026 values: none/lite =
// basic, plus = gold, pro = premium). Returns a short badge, or '' for Basic.
const ALIAS = { none: 'basic', lite: 'basic', plus: 'gold', pro: 'premium' };
export function couponTierBadge(coupon) {
  const t = ALIAS[coupon?.requiredPlanTier] || coupon?.requiredPlanTier || 'basic';
  return t === 'gold' ? 'Gold+' : t === 'premium' ? 'Premium' : '';
}
