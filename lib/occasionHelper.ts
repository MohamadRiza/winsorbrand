// lib/occasionHelper.ts

export interface SpecialOccasion {
  id: string;
  label: string;
  emoji: string;
  dateStr: string; // e.g. "February 14, 2026"
  isToday: boolean;
  isUpcoming: boolean; // within 7 days
  daysRemaining: number;
}

// Oudin's Algorithm for Easter Sunday
export function getEasterSunday(year: number): Date {
  const f = Math.floor;
  const c = f(year / 100);
  const n = year - 19 * f(year / 19);
  const k = f((c - 17) / 25);
  let i = c - f(c / 4) - f((c - k) / 3) + 19 * n + 15;
  i = i - 30 * f(i / 30);
  i = i - f(i / 28) * (1 - f(i / 28) * f(29 / (i + 1)) * f((21 - n) / 11));
  let j = year + f(year / 4) + i + 2 - c + f(c / 4);
  j = j - 7 * f(j / 7);
  const l = i - j;
  const month = 3 + f((l + 40) / 44);
  const day = l + 28 - 31 * f(month / 4);
  return new Date(year, month - 1, day);
}

export function getMothersDay(year: number): Date {
  // 2nd Sunday in May
  const date = new Date(year, 4, 1);
  let sundays = 0;
  while (sundays < 2) {
    if (date.getDay() === 0) sundays++;
    if (sundays < 2) date.setDate(date.getDate() + 1);
  }
  return date;
}

export function getFathersDay(year: number): Date {
  // 3rd Sunday in June
  const date = new Date(year, 5, 1);
  let sundays = 0;
  while (sundays < 3) {
    if (date.getDay() === 0) sundays++;
    if (sundays < 3) date.setDate(date.getDate() + 1);
  }
  return date;
}

// Eid al-Fitr lookup (2026-2030)
export function getEidAlFitr(year: number): Date {
  const dates: Record<number, { m: number; d: number }> = {
    2026: { m: 2, d: 20 }, // March 20
    2027: { m: 2, d: 10 }, // March 10
    2028: { m: 1, d: 28 }, // Feb 28
    2029: { m: 1, d: 17 }, // Feb 17
    2030: { m: 1, d: 7 },  // Feb 7
  };
  const val = dates[year] || { m: 2, d: 20 };
  return new Date(year, val.m, val.d);
}

// Eid al-Adha lookup (2026-2030)
export function getEidAlAdha(year: number): Date {
  const dates: Record<number, { m: number; d: number }> = {
    2026: { m: 4, d: 27 }, // May 27
    2027: { m: 4, d: 17 }, // May 17
    2028: { m: 4, d: 6 },  // May 6
    2029: { m: 3, d: 25 }, // April 25
    2030: { m: 3, d: 15 }, // April 15
  };
  const val = dates[year] || { m: 4, d: 27 };
  return new Date(year, val.m, val.d);
}

// Esala Perahera range lookup
export function getEsalaPeraheraRange(year: number): { start: Date; end: Date } {
  const ranges: Record<number, { sm: number; sd: number; em: number; ed: number }> = {
    2026: { sm: 7, sd: 18, em: 7, ed: 28 }, // Aug 18 - 28
    2027: { sm: 6, sd: 9, em: 6, ed: 19 },   // Jul 9 - 19
    2028: { sm: 7, sd: 26, em: 8, ed: 5 },   // Aug 26 - Sep 5
    2029: { sm: 7, sd: 15, em: 7, ed: 25 },  // Aug 15 - 25
    2030: { sm: 7, sd: 5, em: 7, ed: 15 },   // Aug 5 - 15
  };
  const val = ranges[year] || { sm: 7, sd: 18, em: 7, ed: 28 };
  return {
    start: new Date(year, val.sm, val.sd),
    end: new Date(year, val.em, val.ed),
  };
}

export function getUpcomingOccasions(currentDate: Date = new Date()): SpecialOccasion[] {
  const year = currentDate.getFullYear();
  
  // Define our holidays for the current year
  const holidays = [
    { id: 'new-year', label: 'New Year', emoji: '🎉', getDates: (y: number) => [{ start: new Date(y, 0, 1), end: new Date(y, 0, 1) }] },
    { id: 'thai-pongal', label: 'Thai Pongal', emoji: '🌾', getDates: (y: number) => [{ start: new Date(y, 0, 14), end: new Date(y, 0, 14) }] },
    { id: 'valentines-day', label: "Valentine's Day", emoji: '💖', getDates: (y: number) => [{ start: new Date(y, 1, 14), end: new Date(y, 1, 14) }] },
    { id: 'womens-day', label: "Women's Day", emoji: '👩', getDates: (y: number) => [{ start: new Date(y, 2, 8), end: new Date(y, 2, 8) }] },
    { id: 'eid-fitr', label: 'Eid al-Fitr', emoji: '🕌', getDates: (y: number) => [{ start: getEidAlFitr(y), end: getEidAlFitr(y) }] },
    { id: 'easter-sunday', label: 'Easter Sunday', emoji: '🐣', getDates: (y: number) => [{ start: getEasterSunday(y), end: getEasterSunday(y) }] },
    { id: 'sinhala-tamil-new-year', label: 'Sinhala & Tamil New Year', emoji: '🌞', getDates: (y: number) => [{ start: new Date(y, 3, 13), end: new Date(y, 3, 14) }] },
    { id: 'mothers-day', label: "Mother's Day", emoji: '👩‍👧‍👦', getDates: (y: number) => [{ start: getMothersDay(y), end: getMothersDay(y) }] },
    { id: 'eid-adha', label: 'Eid al-Adha', emoji: '🕌', getDates: (y: number) => [{ start: getEidAlAdha(y), end: getEidAlAdha(y) }] },
    { id: 'fathers-day', label: "Father's Day", emoji: '👨‍👧‍👦', getDates: (y: number) => [{ start: getFathersDay(y), end: getFathersDay(y) }] },
    { id: 'esala-perahera', label: 'Esala Perahera', emoji: '🐘', getDates: (y: number) => [getEsalaPeraheraRange(y)] },
    { id: 'graduation', label: 'Graduation', emoji: '🎓', getDates: (y: number) => [{ start: new Date(y, 10, 15), end: new Date(y, 10, 15) }] },
    { id: 'christmas', label: 'Christmas', emoji: '🎄', getDates: (y: number) => [{ start: new Date(y, 11, 25), end: new Date(y, 11, 25) }] },
  ];

  const results: SpecialOccasion[] = [];
  const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

  for (const holiday of holidays) {
    const datesList = holiday.getDates(year);
    // Also support checking the next year to avoid missing Jan 1 reminders in late December
    if (currentDate.getMonth() === 11 && currentDate.getDate() >= 24) {
      datesList.push(...holiday.getDates(year + 1));
    }

    for (const { start, end } of datesList) {
      const occasionStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const occasionEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());

      // Check if current date is inside the occasion range (active today)
      if (startOfDay >= occasionStart && startOfDay <= occasionEnd) {
        results.push({
          id: holiday.id,
          label: holiday.label,
          emoji: holiday.emoji,
          dateStr: start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          isToday: true,
          isUpcoming: false,
          daysRemaining: 0,
        });
        break;
      }

      // Check if it is upcoming within 7 days
      const diffTime = occasionStart.getTime() - startOfDay.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0 && diffDays <= 7) {
        results.push({
          id: holiday.id,
          label: holiday.label,
          emoji: holiday.emoji,
          dateStr: start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          isToday: false,
          isUpcoming: true,
          daysRemaining: diffDays,
        });
        break;
      }
    }
  }

  return results;
}
