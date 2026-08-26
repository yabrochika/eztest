/** Friday-start weeks in Japan Standard Time (金〜木). JST has no DST. */
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

export const DASHBOARD_WEEK_COUNT = 8;

export interface WeekWindow {
  start: Date;
  end: Date;
  startKey: string;
  endKey: string;
}

export function toJstDateKey(date: Date): string {
  const jst = new Date(date.getTime() + JST_OFFSET_MS);
  const year = jst.getUTCFullYear();
  const month = String(jst.getUTCMonth() + 1).padStart(2, '0');
  const day = String(jst.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function startOfFridayWeek(date: Date): Date {
  const jst = new Date(date.getTime() + JST_OFFSET_MS);
  const year = jst.getUTCFullYear();
  const month = jst.getUTCMonth();
  const day = jst.getUTCDate();
  const weekday = jst.getUTCDay();
  const daysSinceFriday = (weekday - 5 + 7) % 7;
  const utcMidnightOfJstDate = Date.UTC(year, month, day - daysSinceFriday);
  return new Date(utcMidnightOfJstDate - JST_OFFSET_MS);
}

export function buildFridayWeeks(count: number = DASHBOARD_WEEK_COUNT, now: Date = new Date()): WeekWindow[] {
  const currentStart = startOfFridayWeek(now);
  const weeks: WeekWindow[] = [];

  for (let i = count - 1; i >= 0; i -= 1) {
    const start = addDays(currentStart, -i * 7);
    const end = addDays(start, 7);
    weeks.push({
      start,
      end,
      startKey: toJstDateKey(start),
      endKey: toJstDateKey(addDays(end, -1)),
    });
  }

  return weeks;
}

export function weekIndexFor(date: Date, weeks: WeekWindow[]): number {
  const time = date.getTime();
  return weeks.findIndex((week) => time >= week.start.getTime() && time < week.end.getTime());
}
