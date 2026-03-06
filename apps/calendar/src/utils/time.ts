// Layout constants
export const BASE_START_MIN = 7 * 60; // 7:00
export const END_MIN = 23 * 60; // 23:00

// Semester start: 2025-09-15 (Monday)
export const SEMESTER_START = new Date(2025, 8, 15);

export function pad(n: number): string {
  return n < 10 ? '0' + n : '' + n;
}

export function fmtTime(h: number, m: number): string {
  return `${pad(h)}:${pad(m)}`;
}

export function fmtHM(minutesOfDay: number): string {
  const h = Math.floor(minutesOfDay / 60);
  const m = minutesOfDay % 60;
  return fmtTime(h, m);
}

export function formatDateLabel(d: Date): string {
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 is Sunday
  const diff = day === 0 ? -6 : 1 - day; // Go back to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function parseHM(str: string): number {
  const [h, m] = str.split(':').map(Number);
  return h * 60 + m;
}

export function getWeekNumber(weekStart: Date): number {
  const semStart = getWeekStart(SEMESTER_START);
  const diffDays = Math.floor((weekStart.getTime() - semStart.getTime()) / (24 * 3600 * 1000));
  const w = Math.floor(diffDays / 7) + 1;
  return w;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function formatHMS(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
