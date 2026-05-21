export function toman(n) {
  if (n == null) return '';
  const v = Math.round(n);
  return `${v.toLocaleString('fa-IR')} تومان`;
}

export function persianNumber(n) {
  if (n == null) return '';
  return n.toLocaleString('fa-IR');
}

export function persianDate(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }); } catch { return ''; }
}

export function persianTime(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
}

export function persianDateTime(d) {
  if (!d) return '';
  return `${persianDate(d)} - ${persianTime(d)}`;
}

const FALLBACKS = {
  restaurant: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
  cafe: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
  bar: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800',
  fastfood: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
  entertainment: 'https://images.unsplash.com/photo-1489599735193-3d05d54d8ec5?w=800',
  fitness: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
  beauty: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
  retail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
  default: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
  logo: 'https://api.dicebear.com/7.x/initials/svg?seed=',
};

export function imageFor(item, kind = 'default') {
  if (item?.heroImageUrl) return item.heroImageUrl;
  if (item?.coverImageUrl) return item.coverImageUrl;
  if (item?.imageUrl) return item.imageUrl;
  const category = item?.category || item?.categorySlug || kind;
  return FALLBACKS[category] || FALLBACKS.default;
}

export function logoFor(name) {
  return FALLBACKS.logo + encodeURIComponent(name || 'H');
}

export function roleLabel(r) {
  return { admin: 'مدیر کل', vendor: 'مالک بیزنس', merchant_staff: 'پرسنل', customer: 'مشتری' }[r] || r;
}

export function permissionLabel(p) {
  return {
    manage_coupons: 'مدیریت کوپن‌ها',
    view_stats: 'مشاهده آمار',
    manage_team: 'مدیریت تیم',
    scan_only: 'فقط اسکن',
    manage_merchants: 'مدیریت شعب',
  }[p] || p;
}

export function categoryLabel(c) {
  return { restaurant: 'رستوران', cafe: 'کافه', bar: 'بار', retail: 'فروشگاه', fitness: 'باشگاه', beauty: 'زیبایی', entertainment: 'سرگرمی', fastfood: 'فست‌فود' }[c] || c;
}

export function statusLabel(s) {
  return {
    active: 'فعال', suspended: 'معلق', pending: 'در انتظار',
    draft: 'پیش‌نویس', paused: 'متوقف', expired: 'منقضی', sold_out: 'تمام شده',
    succeeded: 'موفق', failed: 'ناموفق', refunded: 'بازپرداخت',
    completed: 'تکمیل شد', fully_redeemed: 'استفاده شده',
  }[s] || s;
}

export function methodLabel(m) {
  return { zibal: 'زیبال', zarinpal: 'زرین‌پال', saman: 'بانک سامان', card_to_card: 'کارت به کارت' }[m] || m;
}

export function offerTypeLabel(t) {
  return { BOGO: 'یکی بخر دوتا ببر', PERCENT_OFF: 'درصد تخفیف', FLAT_OFF: 'تخفیف ثابت', FREE_ITEM: 'هدیه رایگان', BUNDLE: 'پکیج' }[t] || t;
}

export function offerKindLabel(k) {
  return { member_perk: 'مزایای اعضا', surprise_bag: 'پاکت شگفتی' }[k] || k;
}
