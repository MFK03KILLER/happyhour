export function detectMapProvider() {
  const stored = localStorage.getItem('hh_map_provider');
  if (stored) return stored;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod|Macintosh/.test(ua)) return 'apple';
  return 'google';
}

export function setMapProvider(p) {
  localStorage.setItem('hh_map_provider', p);
}

export function directionsUrl({ lat, lng, label } = {}) {
  if (lat == null || lng == null) return null;
  const provider = detectMapProvider();
  const q = encodeURIComponent(label || `${lat},${lng}`);
  if (provider === 'apple') {
    return `https://maps.apple.com/?daddr=${lat},${lng}&q=${q}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${q}`;
}

export function searchUrl({ lat, lng, label } = {}) {
  if (lat == null || lng == null) return null;
  const provider = detectMapProvider();
  const q = encodeURIComponent(label || `${lat},${lng}`);
  if (provider === 'apple') return `https://maps.apple.com/?ll=${lat},${lng}&q=${q}`;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${q}`;
}
