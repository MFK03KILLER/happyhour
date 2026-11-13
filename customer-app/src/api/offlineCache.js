// Last-good copies of read requests, for people on weak connections. When a
// GET fails (no signal, timeout, server hiccup) the app gets the last copy it
// saw instead of an empty or frozen screen. Fresh data always wins when the
// network answers.
const PREFIX = 'hh_c1:';
const MAX_ENTRY = 300 * 1024;        // skip unusually large responses
const MAX_AGE = 7 * 24 * 3600 * 1000;

// Lists and pages people browse. Anything per-account is keyed by the signed-in
// user and wiped on sign-out (see clearOfflineCache).
const CACHEABLE = [
  /^\/customer\/(discover|coupons\/browse|merchants\/|coupons\/[^/]+$|surprise-bags|categories|wallet$|subscription$|deliveries)/,
  /^\/public\//,
];

function userTag() {
  const t = localStorage.getItem('hh_access_token');
  if (!t) return 'guest';
  try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).sub || 'user'; } catch { return 'user'; }
}

export function cacheKey(config) {
  const url = (config.url || '').replace(/^https?:\/\/[^/]+/, '').replace(/^\/api\/v1/, '');
  if (!CACHEABLE.some((re) => re.test(url))) return null;
  const params = config.params ? JSON.stringify(Object.keys(config.params).sort().map((k) => [k, config.params[k]])) : '';
  return `${PREFIX}${userTag()}:${url}?${params}`;
}

export function saveResponse(config, data) {
  const key = cacheKey(config);
  if (!key) return;
  let text;
  try { text = JSON.stringify({ t: Date.now(), d: data }); } catch { return; }
  if (text.length > MAX_ENTRY) return;
  try { localStorage.setItem(key, text); } catch {
    pruneOfflineCache(true);
    try { localStorage.setItem(key, text); } catch { /* storage full: skip */ }
  }
}

export function readResponse(config) {
  const key = cacheKey(config);
  if (!key) return null;
  try {
    const hit = JSON.parse(localStorage.getItem(key) || 'null');
    if (!hit || Date.now() - hit.t > MAX_AGE) return null;
    return hit.d;
  } catch { return null; }
}

export function pruneOfflineCache(aggressive = false) {
  const entries = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith(PREFIX)) continue;
    try { entries.push([k, JSON.parse(localStorage.getItem(k)).t || 0]); } catch { entries.push([k, 0]); }
  }
  entries.sort((a, b) => a[1] - b[1]);
  const drop = aggressive ? Math.ceil(entries.length / 2) : entries.filter(([, t]) => Date.now() - t > MAX_AGE).length;
  entries.slice(0, drop).forEach(([k]) => localStorage.removeItem(k));
}

export function clearOfflineCache() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX)) keys.push(k);
  }
  keys.forEach((k) => localStorage.removeItem(k));
}
