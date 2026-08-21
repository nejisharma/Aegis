export interface PatchDate {
  date: Date;
  vendors: string[];
  label: string;
  isPast: boolean;
  isNext: boolean;
}

function getNthDayOfMonth(year: number, month: number, dayOfWeek: number, n: number): Date {
  const first = new Date(year, month, 1);
  let dayOffset = dayOfWeek - first.getDay();
  if (dayOffset < 0) dayOffset += 7;
  return new Date(year, month, 1 + dayOffset + (n - 1) * 7);
}

export function getSecondTuesday(year: number, month: number): Date {
  return getNthDayOfMonth(year, month, 2, 2);
}

/** Oracle Critical Patch Updates: Jan, Apr, Jul, Oct, on the Tuesday closest to the 17th. */
export function getOracleCpuDate(year: number, quarter: number): Date | null {
  const months = [0, 3, 6, 9];
  if (quarter < 0 || quarter > 3) return null;
  const month = months[quarter];
  const target = new Date(year, month, 17);
  let diff = 2 - target.getDay();
  if (diff > 3) diff -= 7;
  if (diff < -3) diff += 7;
  return new Date(year, month, 17 + diff);
}

/** Same windowing as the website: 3 entries before the next date, 6 from it onward. */
export function generatePatchDates(now: Date): PatchDate[] {
  const dates: PatchDate[] = [];
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  for (let offset = -6; offset <= 6; offset++) {
    let month = currentMonth + offset;
    let year = currentYear;
    if (month < 0) {
      month += 12;
      year -= 1;
    } else if (month > 11) {
      month -= 12;
      year += 1;
    }
    const patchTuesday = getSecondTuesday(year, month);
    dates.push({
      date: patchTuesday,
      vendors: ['Microsoft', 'Adobe'],
      label: 'Patch Tuesday',
      isPast: patchTuesday < now,
      isNext: false,
    });
  }

  for (let yearOff = -1; yearOff <= 1; yearOff++) {
    const y = currentYear + yearOff;
    for (let q = 0; q < 4; q++) {
      const cpuDate = getOracleCpuDate(y, q);
      if (cpuDate) {
        dates.push({
          date: cpuDate,
          vendors: ['Oracle'],
          label: 'Critical Patch Update',
          isPast: cpuDate < now,
          isNext: false,
        });
      }
    }
  }

  dates.sort((a, b) => a.date.getTime() - b.date.getTime());
  const next = dates.find((d) => !d.isPast);
  if (next) next.isNext = true;

  const nextIdx = dates.findIndex((d) => d.isNext);
  if (nextIdx >= 0) return dates.slice(Math.max(0, nextIdx - 3), Math.min(dates.length, nextIdx + 6));
  return dates.slice(-6);
}

/** All patch dates (Patch Tuesday + Oracle CPU) falling inside a given month, for the calendar grid. */
export function patchDatesInMonth(year: number, month: number): PatchDate[] {
  const out: PatchDate[] = [];
  const now = new Date();
  const pt = getSecondTuesday(year, month);
  out.push({ date: pt, vendors: ['Microsoft', 'Adobe'], label: 'Patch Tuesday', isPast: pt < now, isNext: false });
  const q = [0, 3, 6, 9].indexOf(month);
  if (q >= 0) {
    const cpu = getOracleCpuDate(year, q);
    if (cpu) out.push({ date: cpu, vendors: ['Oracle'], label: 'Critical Patch Update', isPast: cpu < now, isNext: false });
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}
