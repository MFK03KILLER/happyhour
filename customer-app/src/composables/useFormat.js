export function toman(n) {
  if (n == null) return '';
  const v = Math.round(n);
  return `${v.toLocaleString('fa-IR')} تومان`;
}

export function tomanShort(n) {
  if (n == null) return '';
  if (n >= 1000000) return `${(n / 1000000).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} میلیون`;
  if (n >= 1000) return `${(n / 1000).toLocaleString('fa-IR', { maximumFractionDigits: 0 })} هزار`;
  return n.toLocaleString('fa-IR');
}

export function persianNumber(n) {
  if (n == null) return '';
  return n.toLocaleString('fa-IR');
}

export function persianDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return ''; }
}

export function persianTime(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

export function persianDateTime(d) {
  if (!d) return '';
  return `${persianDate(d)} - ${persianTime(d)}`;
}
