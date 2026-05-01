import { DeadlineSource } from '../types';

export interface DeadlineDraft {
  title: string;
  dueAt: string;
  courseName?: string;
  description?: string;
  source: DeadlineSource;
  confidence: number;
}

const DUE_HINTS = ['截止', '提交', '上交', 'ddl', 'due', '截止时间'];
const TASK_HINTS = ['作业', '任务', '实验', '报告', '练习', '思考题', '预习'];

function toDateAtTime(date: Date, hour: number, minute: number): Date {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function parseChineseDate(token: string, now: Date): Date | null {
  const normalized = token.replace(/\s+/g, '');
  const explicit = normalized.match(/^(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})日?$/);
  if (explicit) {
    const year = Number(explicit[1]);
    const month = Number(explicit[2]) - 1;
    const day = Number(explicit[3]);
    const d = new Date(year, month, day);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const shortDate = normalized.match(/^(\d{1,2})[-/.月](\d{1,2})日?$/);
  if (shortDate) {
    const month = Number(shortDate[1]) - 1;
    const day = Number(shortDate[2]);
    const d = new Date(now.getFullYear(), month, day);
    if (d.getTime() < now.getTime() - 24 * 3600 * 1000) d.setFullYear(now.getFullYear() + 1);
    return d;
  }
  if (normalized === '今天') return toDateAtTime(now, now.getHours(), now.getMinutes());
  if (normalized === '明天') return toDateAtTime(new Date(now.getTime() + 24 * 3600 * 1000), 0, 0);
  if (normalized === '后天') return toDateAtTime(new Date(now.getTime() + 2 * 24 * 3600 * 1000), 0, 0);
  return null;
}

function parseTime(token: string): { hour: number; minute: number } | null {
  const match = token.match(/(\d{1,2})[:：](\d{1,2})/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

function detectTitle(lines: string[]): string {
  const candidate = lines.find((line) => TASK_HINTS.some((hint) => line.includes(hint)));
  if (candidate) return candidate.slice(0, 60);
  return lines[0]?.slice(0, 60) || '未命名作业';
}

function detectCourse(lines: string[]): string | undefined {
  const match = lines
    .map((line) => line.match(/《([^》]{2,30})》/))
    .find((item): item is RegExpMatchArray => Boolean(item));
  if (match) return match[1];
  return undefined;
}

function normalizeLines(rawText: string): string[] {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function detectDueAt(lines: string[], now: Date): { dueAt: string; confidence: number } | null {
  const merged = lines.join(' ');
  const dateTokenMatch = merged.match(
    /(\d{4}[-/.年]\d{1,2}[-/.月]\d{1,2}日?|\d{1,2}[-/.月]\d{1,2}日?|今天|明天|后天)/,
  );
  if (!dateTokenMatch) return null;
  const baseDate = parseChineseDate(dateTokenMatch[1], now);
  if (!baseDate) return null;

  const timeMatch = merged.match(/(\d{1,2}[:：]\d{1,2})/);
  const parsedTime = timeMatch ? parseTime(timeMatch[1]) : null;
  const due = parsedTime
    ? toDateAtTime(baseDate, parsedTime.hour, parsedTime.minute)
    : toDateAtTime(baseDate, 23, 59);

  const confidence = parsedTime ? 0.88 : 0.72;
  return { dueAt: due.toISOString(), confidence };
}

export function parseDeadlineDraft(rawText: string, source: DeadlineSource): DeadlineDraft | null {
  const now = new Date();
  const lines = normalizeLines(rawText);
  if (lines.length === 0) return null;
  const textBlob = lines.join(' ');
  if (!DUE_HINTS.some((hint) => textBlob.includes(hint))) return null;
  const dueInfo = detectDueAt(lines, now);
  if (!dueInfo) return null;

  const title = detectTitle(lines);
  const courseName = detectCourse(lines);
  const description = lines.slice(0, 6).join('\n');
  return {
    title,
    dueAt: dueInfo.dueAt,
    courseName,
    description,
    source,
    confidence: dueInfo.confidence,
  };
}
