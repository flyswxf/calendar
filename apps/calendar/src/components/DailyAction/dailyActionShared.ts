import type { DailyActionEvent } from '../../types';

export type RoughTimeSlot = '清晨' | '上午' | '中午' | '下午' | '傍晚' | '晚上' | '深夜' | '吃完晚饭后';
export type RoughDurationWord = '很快' | '一会' | '一阵' | '一个多小时' | '一下午';

export type Candidate = {
  key: string;
  label: string;
  startMin: number;
  durationMin: number;
  reason: string;
};

export type ActiveSession = {
  name: string;
  startAt: string;
  dateKey: string;
};

export type EditDraft = {
  id: string;
  name: string;
  startHour: number;
  startMinute: number;
  durationMin: number;
};

export const ACTIVE_SESSION_KEY = 'dailyActionActiveSession';
export const durationBuckets = [5, 15, 30, 60, 120, 240];
export const roughSlotDefaults: Record<RoughTimeSlot, number> = {
  清晨: 390,
  上午: 600,
  中午: 750,
  下午: 900,
  傍晚: 1110,
  晚上: 1200,
  深夜: 1410,
  吃完晚饭后: 1140
};
export const roughDurationDefaults: Record<RoughDurationWord, number> = {
  很快: 5,
  一会: 20,
  一阵: 45,
  一个多小时: 90,
  一下午: 240
};
export const roughTimeSlots = Object.keys(roughSlotDefaults) as RoughTimeSlot[];
export const roughDurationWords = Object.keys(roughDurationDefaults) as RoughDurationWord[];
export const pieColors = ['#2563eb', '#16a34a', '#eab308', '#ec4899', '#8b5cf6', '#f97316', '#14b8a6', '#64748b'];

export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function toHM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function dateWithMinutes(date: Date, minutes: number): Date {
  const d = new Date(date);
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d;
}

export function calcDurationMin(startIso: string, endIso: string): number {
  const diff = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Math.max(1, Math.round(diff / 60000));
}

export function dateByKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1, 0, 0, 0, 0);
}

export function clampEventRange(dateKey: string, startAt: Date, endAt: Date): { startAtIso: string; endAtIso: string; durationMin: number } {
  const dayStart = dateByKey(dateKey);
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 0, 0);
  const safeStart = new Date(Math.max(dayStart.getTime(), Math.min(dayEnd.getTime(), startAt.getTime())));
  const safeEnd = new Date(Math.max(safeStart.getTime() + 60000, Math.min(dayEnd.getTime(), endAt.getTime())));
  return {
    startAtIso: safeStart.toISOString(),
    endAtIso: safeEnd.toISOString(),
    durationMin: calcDurationMin(safeStart.toISOString(), safeEnd.toISOString())
  };
}

export function getEventDurationMin(event: DailyActionEvent, now: Date): number {
  if (event.endAt) return event.durationMin;
  const diff = now.getTime() - new Date(event.startAt).getTime();
  return Math.max(1, Math.round(diff / 60000));
}

export function buildNameStats(events: DailyActionEvent[]): Map<string, { count: number; avgStartMin: number; avgDurationMin: number }> {
  const bucket = new Map<string, { starts: number[]; durations: number[] }>();
  for (const event of events) {
    const start = new Date(event.startAt);
    if (Number.isNaN(start.getTime())) continue;
    const startMin = start.getHours() * 60 + start.getMinutes();
    if (!bucket.has(event.name)) bucket.set(event.name, { starts: [], durations: [] });
    const hit = bucket.get(event.name);
    if (!hit) continue;
    hit.starts.push(startMin);
    hit.durations.push(Math.max(1, event.durationMin));
  }
  const result = new Map<string, { count: number; avgStartMin: number; avgDurationMin: number }>();
  bucket.forEach((value, key) => {
    const avgStart = value.starts.reduce((sum, x) => sum + x, 0) / value.starts.length;
    const avgDuration = value.durations.reduce((sum, x) => sum + x, 0) / value.durations.length;
    result.set(key, {
      count: value.starts.length,
      avgStartMin: Math.round(avgStart),
      avgDurationMin: Math.round(avgDuration)
    });
  });
  return result;
}

export function nearestBucket(value: number): number {
  return durationBuckets.reduce((best, item) => (Math.abs(item - value) < Math.abs(best - value) ? item : best), durationBuckets[0]);
}
