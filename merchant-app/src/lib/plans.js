// Member plans as shown to venue staff (who paid for what, for payouts).
export const PLAN_STYLE = {
  basic: { label: 'Basic', cls: 'bg-teal-50 text-teal-800 border-teal-200' },
  gold: { label: 'Gold', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
  premium: { label: 'Premium', cls: 'bg-purple-100 text-purple-800 border-purple-300' },
  free: { label: 'No plan', cls: 'bg-cream-200 text-ink-500 border-ink-300/30' },
  unknown: { label: 'Before plans', cls: 'bg-cream-200 text-ink-500 border-ink-300/30' },
};
export const planStyle = (t) => PLAN_STYLE[t] || PLAN_STYLE.unknown;
export const TIER_OPTIONS = [
  { value: 'basic', label: 'All members (Basic and up)' },
  { value: 'gold', label: 'Gold and Premium only' },
  { value: 'premium', label: 'Premium only' },
];
