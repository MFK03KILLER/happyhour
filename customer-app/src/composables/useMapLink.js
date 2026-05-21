export function detectMapProvider() {
  const stored = localStorage.getItem('hh_map_provider');
  if (stored) return stored;
  return 'neshan';
}

export function setMapProvider(p) {
  localStorage.setItem('hh_map_provider', p);
}

export function mapProviders() {
  return [
    { key: 'neshan', label: 'نشان' },
    { key: 'balad', label: 'بلد' },
    { key: 'google', label: 'گوگل مپ' },
  ];
}

export function directionsUrl({ lat, lng, label } = {}) {
  if (lat == null || lng == null) return null;
  const provider = detectMapProvider();
  if (provider === 'neshan') return `https://nshn.ir/maps?to=${lat},${lng}`;
  if (provider === 'balad') return `https://balad.ir/location?latitude=${lat}&longitude=${lng}&zoom=16`;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function searchUrl({ lat, lng, label } = {}) {
  if (lat == null || lng == null) return null;
  const provider = detectMapProvider();
  if (provider === 'neshan') return `https://neshan.org/maps/@${lat},${lng},16z`;
  if (provider === 'balad') return `https://balad.ir/location?latitude=${lat}&longitude=${lng}&zoom=16`;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
