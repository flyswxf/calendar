/**
 * 时间工具函数集
 * 布局常量 / 格式化 / 日期计算 / ICS 转义
 */

// 日历网格的显示范围：7:00 - 23:00
export const BASE_START_MIN = 7 * 60;
export const END_MIN = 23 * 60;

// 学期起始日（用于周数计算）
export const SEMESTER_START = new Date(2025, 8, 15);

/** 个位数补零 */
export function pad(n: number): string {
  return n < 10 ? '0' + n : '' + n;
}

/** 时:分 → "HH:MM" */
export function fmtTime(h: number, m: number): string {
  return `${pad(h)}:${pad(m)}`;
}

/** 一天内的分钟数 → "HH:MM" */
export function fmtHM(minutesOfDay: number): string {
  const h = Math.floor(minutesOfDay / 60);
  const m = minutesOfDay % 60;
  return fmtTime(h, m);
}

/** Date → "YYYY.MM.DD" */
export function formatDateLabel(d: Date): string {
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

/** Date → "YYYY-MM-DD" */
export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 获取给定日期所在周的周一 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** 日期加减天数（不改变原始对象） */
export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** "HH:MM" → 分钟数 */
export function parseHM(str: string): number {
  const [h, m] = str.split(':').map(Number);
  return h * 60 + m;
}

/** 基于开学日期计算教学周 */
export function getWeekNumber(weekStart: Date): number {
  const semStart = getWeekStart(SEMESTER_START);
  const diffDays = Math.floor((weekStart.getTime() - semStart.getTime()) / (24 * 3600 * 1000));
  return Math.floor(diffDays / 7) + 1;
}

/** 数值钳位 */
export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** 毫秒 → "HH:MM:SS" */
export function formatHMS(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/** ICS 格式文本转义 */
export function escapeICS(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

/** 在给定日期上设置小时/分钟 → 同一天的 Date */
export function dateWithMinutes(date: Date, minutes: number): Date {
  const d = new Date(date);
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d;
}

/** 两个 ISO 字符串之间的分钟差（≥1） */
export function calcDurationMin(startIso: string, endIso: string): number {
  const diff = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Math.max(1, Math.round(diff / 60000));
}
