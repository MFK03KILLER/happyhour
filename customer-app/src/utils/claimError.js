// Toast for a failed claim. Plan limits get an "Upgrade" button.
export function claimErrorToast(toast, router, e) {
  const err = e?.response?.data?.error || {};
  const msg = err.message || 'Could not claim coupon';
  if (err.code === 'MONTHLY_LIMIT_REACHED' || err.code === 'PLAN_UPGRADE_REQUIRED' || err.code === 'MEMBERSHIP_REQUIRED') {
    const title = err.code === 'MONTHLY_LIMIT_REACHED' ? 'Monthly limit reached' : err.code === 'MEMBERSHIP_REQUIRED' ? 'Membership required' : 'Upgrade to claim';
    const upgradeable = !/Premium members|have used all 4/.test(msg);
    toast.warning(msg, { title, ttl: 8000, action: upgradeable ? { label: err.code === 'MEMBERSHIP_REQUIRED' ? 'See plans →' : 'Upgrade →', handler: () => router.push('/subscribe') } : undefined });
    return;
  }
  toast.error(msg, { title: 'Claim failed' });
}
