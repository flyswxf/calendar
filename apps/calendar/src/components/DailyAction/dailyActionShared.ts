import type { DailyActionEvent } from '../../types';
import { clamp, calcDurationMin } from '../../utils/time';

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

export type NameStatsV2 = {
  count: number;
  recentCount: number;
  avgStartMin: number;
  avgDurationMin: number;
  recentAvgStartMin: number | null;
  recentAvgDurationMin: number | null;
  medianStartMin: number;
  p25DurationMin: number;
  p75DurationMin: number;
  lastSeenAt: string;
};

export type BReadinessReport = {
  ready: boolean;
  score: number;
  requiredScore: number;
  metrics: {
    totalEvents: number;
    distinctNames: number;
    qualifiedNames: number;
    recentEvents: number;
  };
  thresholds: {
    minTotalEvents: number;
    minDistinctNames: number;
    minQualifiedNames: number;
    minRecentEvents: number;
    minPerNameEvents: number;
    recentWindowDays: number;
  };
  missing: string[];
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

function quantile(sortedValues: number[], q: number): number {
  if (sortedValues.length === 0) return 0;
  const pos = (sortedValues.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const next = sortedValues[base + 1] ?? sortedValues[base];
  return Math.round(sortedValues[base] + rest * (next - sortedValues[base]));
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeActionName(name: string): string {
  return name.trim().replace(/\s+/g, '');
}

export function buildNameStatsV2(events: DailyActionEvent[], now: Date, recentWindowDays = 7): Map<string, NameStatsV2> {
  const nowTs = now.getTime();
  const recentMs = recentWindowDays * 24 * 60 * 60 * 1000;
  const bucket = new Map<string, { starts: number[]; durations: number[]; recentStarts: number[]; recentDurations: number[]; lastSeenTs: number }>();
  for (const event of events) {
    const normalized = normalizeActionName(event.name);
    if (!normalized) continue;
    const start = new Date(event.startAt);
    if (Number.isNaN(start.getTime())) continue;
    const startMin = start.getHours() * 60 + start.getMinutes();
    const durationMin = Math.max(1, event.durationMin);
    if (!bucket.has(normalized)) {
      bucket.set(normalized, { starts: [], durations: [], recentStarts: [], recentDurations: [], lastSeenTs: 0 });
    }
    const hit = bucket.get(normalized);
    if (!hit) continue;
    hit.starts.push(startMin);
    hit.durations.push(durationMin);
    const startTs = start.getTime();
    if (startTs > hit.lastSeenTs) hit.lastSeenTs = startTs;
    if (nowTs - startTs <= recentMs) {
      hit.recentStarts.push(startMin);
      hit.recentDurations.push(durationMin);
    }
  }
  const result = new Map<string, NameStatsV2>();
  bucket.forEach((value, key) => {
    const sortedStarts = [...value.starts].sort((a, b) => a - b);
    const sortedDurations = [...value.durations].sort((a, b) => a - b);
    const avgStart = Math.round(mean(value.starts));
    const avgDuration = Math.round(mean(value.durations));
    const recentAvgStart = value.recentStarts.length > 0 ? Math.round(mean(value.recentStarts)) : null;
    const recentAvgDuration = value.recentDurations.length > 0 ? Math.round(mean(value.recentDurations)) : null;
    result.set(key, {
      count: value.starts.length,
      recentCount: value.recentStarts.length,
      avgStartMin: avgStart,
      avgDurationMin: avgDuration,
      recentAvgStartMin: recentAvgStart,
      recentAvgDurationMin: recentAvgDuration,
      medianStartMin: quantile(sortedStarts, 0.5),
      p25DurationMin: quantile(sortedDurations, 0.25),
      p75DurationMin: quantile(sortedDurations, 0.75),
      lastSeenAt: new Date(value.lastSeenTs).toISOString()
    });
  });
  return result;
}

export function assessBReadiness(
  events: DailyActionEvent[],
  now: Date,
  options?: Partial<BReadinessReport['thresholds']>
): BReadinessReport {
  const thresholds = {
    minTotalEvents: options?.minTotalEvents ?? 40,
    minDistinctNames: options?.minDistinctNames ?? 6,
    minQualifiedNames: options?.minQualifiedNames ?? 3,
    minRecentEvents: options?.minRecentEvents ?? 12,
    minPerNameEvents: options?.minPerNameEvents ?? 5,
    recentWindowDays: options?.recentWindowDays ?? 7
  };
  const recentMs = thresholds.recentWindowDays * 24 * 60 * 60 * 1000;
  const nameCounts = new Map<string, number>();
  let recentEvents = 0;
  for (const event of events) {
    const normalized = normalizeActionName(event.name);
    if (!normalized) continue;
    nameCounts.set(normalized, (nameCounts.get(normalized) ?? 0) + 1);
    const startTs = new Date(event.startAt).getTime();
    if (!Number.isNaN(startTs) && now.getTime() - startTs <= recentMs) {
      recentEvents += 1;
    }
  }
  const totalEvents = events.length;
  const distinctNames = nameCounts.size;
  const qualifiedNames = [...nameCounts.values()].filter((count) => count >= thresholds.minPerNameEvents).length;
  const missing: string[] = [];
  if (totalEvents < thresholds.minTotalEvents) {
    missing.push(`总样本不足（${totalEvents}/${thresholds.minTotalEvents}）`);
  }
  if (distinctNames < thresholds.minDistinctNames) {
    missing.push(`事件类型不足（${distinctNames}/${thresholds.minDistinctNames}）`);
  }
  if (qualifiedNames < thresholds.minQualifiedNames) {
    missing.push(`稳定事件不足（${qualifiedNames}/${thresholds.minQualifiedNames}）`);
  }
  if (recentEvents < thresholds.minRecentEvents) {
    missing.push(`近期样本不足（${recentEvents}/${thresholds.minRecentEvents}）`);
  }
  const score = [totalEvents >= thresholds.minTotalEvents, distinctNames >= thresholds.minDistinctNames, qualifiedNames >= thresholds.minQualifiedNames, recentEvents >= thresholds.minRecentEvents]
    .filter(Boolean)
    .length;
  const requiredScore = 4;
  return {
    ready: score >= requiredScore,
    score,
    requiredScore,
    metrics: { totalEvents, distinctNames, qualifiedNames, recentEvents },
    thresholds,
    missing
  };
}

export function buildBPreparedCandidates(args: {
  fuzzyName: string;
  fuzzySlot: RoughTimeSlot;
  fuzzyDurationWord: RoughDurationWord;
  isEarlyClassDay: boolean;
  dinnerAnchorMin: number;
  baseSlotMin: number;
  baseDurationMin: number;
  fallbackAvgStats: Map<string, { count: number; avgStartMin: number; avgDurationMin: number }>;
  advancedStats: Map<string, NameStatsV2>;
  minSamplesForStrictStats?: number;
}): Candidate[] {
  const normalizedName = normalizeActionName(args.fuzzyName);
  const strictHistory = normalizedName ? args.advancedStats.get(normalizedName) : null;
  const fallbackHistory = args.fuzzyName ? args.fallbackAvgStats.get(args.fuzzyName) : null;
  const minSamples = args.minSamplesForStrictStats ?? 5;
  const slotCenterRaw = args.fuzzySlot === '吃完晚饭后' ? args.dinnerAnchorMin : args.baseSlotMin;
  const slotCenter = args.fuzzySlot === '上午' && args.isEarlyClassDay ? slotCenterRaw - 75 : slotCenterRaw;
  const strictReady = strictHistory ? strictHistory.count >= minSamples : false;
  const strictStartBase = strictHistory ? (strictHistory.recentAvgStartMin ?? strictHistory.medianStartMin) : null;
  const strictDurationBase = strictHistory ? (strictHistory.recentAvgDurationMin ?? strictHistory.avgDurationMin) : null;
  const fallbackStart = fallbackHistory?.avgStartMin ?? slotCenter;
  const fallbackDuration = fallbackHistory?.avgDurationMin ?? args.baseDurationMin;
  const centerStartRaw = strictReady && strictStartBase !== null ? Math.round((strictStartBase * 0.7) + (slotCenter * 0.3)) : Math.round((fallbackStart + slotCenter) / 2);
  const centerDurationRaw = strictReady && strictDurationBase !== null ? Math.round((strictDurationBase * 0.7) + (args.baseDurationMin * 0.3)) : Math.round((fallbackDuration + args.baseDurationMin) / 2);
  const shortDurationRaw = strictReady && strictHistory ? strictHistory.p25DurationMin : Math.round(centerDurationRaw * 0.7);
  const longDurationRaw = strictReady && strictHistory ? strictHistory.p75DurationMin : Math.round(centerDurationRaw * 1.3);
  const mainDuration = nearestBucket(centerDurationRaw);
  const shortDuration = nearestBucket(Math.max(5, shortDurationRaw));
  const longDuration = nearestBucket(Math.max(shortDuration, longDurationRaw));
  const earlyShift = args.fuzzySlot === '上午' ? -30 : -20;
  const lateShift = args.fuzzySlot === '吃完晚饭后' ? 20 : 30;
  const minStart = 5 * 60;
  const maxStart = 23 * 60 + 40;
  const mainStart = clamp(centerStartRaw, minStart, maxStart);
  const shortStart = clamp(mainStart + earlyShift, minStart, maxStart);
  const longStart = clamp(mainStart + lateShift, minStart, maxStart);
  const sourceText = strictReady ? `B统计(${strictHistory?.count}条)` : fallbackHistory ? `均值预热(${fallbackHistory.count}条)` : '规则默认';
  return [
    { key: 'candidate-main', label: '推荐', startMin: mainStart, durationMin: mainDuration, reason: sourceText },
    { key: 'candidate-short', label: '偏短', startMin: shortStart, durationMin: shortDuration, reason: strictReady ? 'P25分位时长' : '保守短时长估计' },
    { key: 'candidate-long', label: '偏长', startMin: longStart, durationMin: longDuration, reason: strictReady ? 'P75分位时长' : '宽松长时长估计' }
  ];
}

export function nearestBucket(value: number): number {
  return durationBuckets.reduce((best, item) => (Math.abs(item - value) < Math.abs(best - value) ? item : best), durationBuckets[0]);
}
