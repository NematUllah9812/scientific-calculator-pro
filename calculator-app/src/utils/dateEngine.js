/* =====================================================================
 * dateEngine.js — Date difference, business days, duration arithmetic
 * ===================================================================== */

export const MS_DAY = 86400000;

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
export const MONTH_SHORT = MONTH_NAMES.map((m) => m.slice(0, 3));
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_MIN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Normalize to local midnight (avoids DST/timezone drift). */
export function atMidnight(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export function daysInMonth(year, month /* 0-11 */) {
  return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
}

export function toISO(d) {
  const x = atMidnight(d);
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${x.getFullYear()}-${m}-${day}`;
}

export function fromISO(s) {
  if (!s) return new Date();
  const [y, m, d] = String(s).split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

export function formatDate(d, style = 'long') {
  const x = new Date(d);
  if (style === 'iso') return toISO(x);
  if (style === 'short') return `${MONTH_SHORT[x.getMonth()]} ${x.getDate()}, ${x.getFullYear()}`;
  if (style === 'medium') return `${DAY_SHORT[x.getDay()]}, ${MONTH_SHORT[x.getMonth()]} ${x.getDate()}, ${x.getFullYear()}`;
  return `${DAY_SHORT[x.getDay()]}, ${MONTH_NAMES[x.getMonth()]} ${x.getDate()}, ${x.getFullYear()}`;
}

/** Total whole days between two dates (absolute). */
export function daysBetween(a, b) {
  return Math.round(Math.abs(atMidnight(b) - atMidnight(a)) / MS_DAY);
}

/**
 * Calendar-accurate Y/M/D breakdown between two dates.
 */
export function dateDifference(startIn, endIn, { includeEndDay = false } = {}) {
  let start = atMidnight(startIn);
  let end = atMidnight(endIn);
  const reversed = start > end;
  if (reversed) [start, end] = [end, start];

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const pm = new Date(end.getFullYear(), end.getMonth() - 1, 1);
    days += daysInMonth(pm.getFullYear(), pm.getMonth());
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  let totalDays = Math.round((end - start) / MS_DAY);
  if (includeEndDay) totalDays += 1;

  return {
    reversed,
    years,
    months,
    days,
    totalDays,
    totalWeeks: Math.floor(totalDays / 7),
    remainderDays: totalDays % 7,
    totalHours: totalDays * 24,
    totalMinutes: totalDays * 1440,
    totalSeconds: totalDays * 86400,
    totalMonths: years * 12 + months,
    startDate: start,
    endDate: end,
  };
}

/**
 * Counts business days between two dates (inclusive of both endpoints).
 * weekend = array of weekday indices considered non-working (default Sat/Sun).
 */
export function businessDays(startIn, endIn, { weekend = [0, 6], holidays = [] } = {}) {
  let start = atMidnight(startIn);
  let end = atMidnight(endIn);
  if (start > end) [start, end] = [end, start];

  const holidaySet = new Set(holidays.map((h) => toISO(h)));
  let work = 0;
  let weekendDays = 0;
  let holidayCount = 0;
  let total = 0;

  const cur = new Date(start);
  while (cur <= end) {
    total++;
    const dow = cur.getDay();
    const iso = toISO(cur);
    if (weekend.includes(dow)) weekendDays++;
    else if (holidaySet.has(iso)) holidayCount++;
    else work++;
    cur.setDate(cur.getDate() + 1);
  }

  return { total, workingDays: work, weekendDays, holidays: holidayCount };
}

/** Add/subtract a duration from a date. */
export function addToDate(baseIn, { years = 0, months = 0, weeks = 0, days = 0 }, subtract = false) {
  const sign = subtract ? -1 : 1;
  const d = atMidnight(baseIn);
  const targetDay = d.getDate();

  d.setFullYear(d.getFullYear() + sign * Number(years || 0));
  // month-safe addition (clamp to last valid day)
  const targetMonth = d.getMonth() + sign * Number(months || 0);
  d.setDate(1);
  d.setMonth(targetMonth);
  d.setDate(Math.min(targetDay, daysInMonth(d.getFullYear(), d.getMonth())));

  d.setDate(d.getDate() + sign * (Number(weeks || 0) * 7 + Number(days || 0)));
  return d;
}

/** Day-of-year, week number (ISO-8601), and quarter. */
export function dateFacts(dIn) {
  const d = atMidnight(dIn);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const dayOfYear = Math.round((d - startOfYear) / MS_DAY) + 1;

  const target = new Date(d);
  const dayNum = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNum + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const diff = target - firstThursday;
  const week = 1 + Math.round(diff / (7 * MS_DAY));

  return {
    dayOfYear,
    weekNumber: week,
    quarter: Math.floor(d.getMonth() / 3) + 1,
    dayName: DAY_NAMES[d.getDay()],
    monthName: MONTH_NAMES[d.getMonth()],
    isLeap: isLeapYear(d.getFullYear()),
    daysInYear: isLeapYear(d.getFullYear()) ? 366 : 365,
    unix: Math.floor(d.getTime() / 1000),
  };
}

/** Age calculator with next-birthday countdown. */
export function calculateAge(birthIn, refIn = new Date()) {
  const birth = atMidnight(birthIn);
  const ref = atMidnight(refIn);
  const diff = dateDifference(birth, ref);

  let next = new Date(ref.getFullYear(), birth.getMonth(), birth.getDate());
  if (next < ref) next = new Date(ref.getFullYear() + 1, birth.getMonth(), birth.getDate());

  return {
    years: diff.years,
    months: diff.months,
    days: diff.days,
    totalDays: diff.totalDays,
    nextBirthday: next,
    daysToBirthday: Math.round((next - ref) / MS_DAY),
  };
}

/** Build a 6x7 calendar grid for a given month. */
export function buildCalendarGrid(year, month) {
  const first = new Date(year, month, 1);
  const startDow = first.getDay();
  const dim = daysInMonth(year, month);
  const prevDim = daysInMonth(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1);

  const cells = [];
  for (let i = startDow - 1; i >= 0; i--) {
    cells.push({ day: prevDim - i, current: false, month: month - 1, year: month === 0 ? year - 1 : year });
  }
  for (let d = 1; d <= dim; d++) {
    cells.push({ day: d, current: true, month, year });
  }
  let nd = 1;
  while (cells.length < 42) {
    cells.push({ day: nd++, current: false, month: month + 1, year: month === 11 ? year + 1 : year });
  }
  return cells;
}
