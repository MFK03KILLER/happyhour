// Calendar months in Pacific time - the membership allowance resets on the 1st
// at midnight in the Bay Area, wherever the server runs.
const TZ = 'America/Los_Angeles';

function partsInTz(date, tz = TZ) {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  });
  const o = Object.fromEntries(f.formatToParts(date).map((p) => [p.type, p.value]));
  return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour, min: +o.minute, s: +o.second };
}

// UTC instant of a wall-clock time in the zone.
function zonedToUtc(y, m, d, tz = TZ) {
  const guess = Date.UTC(y, m - 1, d);
  const p = partsInTz(new Date(guess), tz);
  const asIfUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s);
  return new Date(guess - (asIfUtc - guess));
}

function monthStart(date = new Date()) {
  const { y, m } = partsInTz(date);
  return zonedToUtc(y, m, 1);
}

function nextMonthStart(date = new Date()) {
  const { y, m } = partsInTz(date);
  return m === 12 ? zonedToUtc(y + 1, 1, 1) : zonedToUtc(y, m + 1, 1);
}

// "2026-11" -> [start, end) in UTC; defaults to the current month.
function monthRange(ym) {
  if (!ym) return [monthStart(), nextMonthStart()];
  const [y, m] = ym.split('-').map(Number);
  const start = zonedToUtc(y, m, 1);
  return [start, m === 12 ? zonedToUtc(y + 1, 1, 1) : zonedToUtc(y, m + 1, 1)];
}

module.exports = { TZ, monthStart, nextMonthStart, monthRange };
