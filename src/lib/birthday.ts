export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Parse a stored `YYYY-MM-DD` date without timezone drift. */
export function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function occurrenceInYear(birthday: Date, year: number): Date {
  const month = birthday.getMonth();
  const day = birthday.getDate();
  // Feb 29 → Feb 28 in non-leap years.
  const isLeapDay = month === 1 && day === 29;
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return new Date(year, month, isLeapDay && !isLeapYear ? 28 : day);
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export interface BirthdayInfo {
  /** Next upcoming (or today's) birthday date. */
  next: Date;
  /** Most recent birthday date that already happened. */
  previous: Date;
  daysUntil: number;
  daysSincePrevious: number;
  isToday: boolean;
  /** Age they will turn on `next`, when the birth year is known. */
  turningAge: number | null;
  /** Age they turned on `previous`, when the birth year is known. */
  turnedAge: number | null;
  monthIndex: number;
  day: number;
}

export function getBirthdayInfo(
  birthday: string | null | undefined,
  hasYear = true,
): BirthdayInfo | null {
  if (!birthday) return null;
  const date = parseDateOnly(birthday);
  if (Number.isNaN(date.getTime())) return null;

  const today = startOfToday();
  const thisYear = occurrenceInYear(date, today.getFullYear());
  const next =
    daysBetween(today, thisYear) >= 0 ? thisYear : occurrenceInYear(date, today.getFullYear() + 1);
  const previous =
    daysBetween(today, thisYear) <= 0 ? thisYear : occurrenceInYear(date, today.getFullYear() - 1);

  return {
    next,
    previous,
    daysUntil: daysBetween(today, next),
    daysSincePrevious: daysBetween(previous, today),
    isToday: daysBetween(today, thisYear) === 0,
    turningAge: hasYear ? next.getFullYear() - date.getFullYear() : null,
    turnedAge: hasYear ? previous.getFullYear() - date.getFullYear() : null,
    monthIndex: date.getMonth(),
    day: date.getDate(),
  };
}

export function formatBirthdayLabel(info: BirthdayInfo): string {
  return `${MONTH_NAMES[info.monthIndex]} ${info.day}`;
}

export function countdownLabel(info: BirthdayInfo): string {
  if (info.isToday) return "Today!";
  if (info.daysUntil === 1) return "Tomorrow";
  return `in ${info.daysUntil} days`;
}
