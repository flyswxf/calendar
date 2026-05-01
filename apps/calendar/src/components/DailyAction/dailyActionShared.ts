/**
 * 行动记录共享类型与工具函数
 * 供 useDailyActionPanel hook 与各 Card 组件共用
 */
import type { DailyActionEvent } from '../../types';
import { clamp, calcDurationMin } from '../../utils/time';

/** 模糊时间段（语义槽位） */
export type RoughTimeSlot = '清晨' | '上午' | '中午' | '下午' | '傍晚' | '晚上' | '深夜' | '吃完晚饭后';
/** 模糊时长（语义描述） */
export type RoughDurationWord = '很快' | '一会' | '一阵' | '一个多小时' | '一下午';

/** 候选记录 */
export type Candidate = {
  key: string;
  label: string;
  startMin: number;
  durationMin: number;
  reason: string;
};

/** 活跃中的会话（计时中） */
export type ActiveSession = {
  name: string;
  startAt: string; // ISO
  dateKey: string;
};

/** 事件编辑草稿 */
export type EditDraft = {
  id: string;
  name: string;
  startHour: number;
  startMinute: number;
  durationMin: number;
};

/** 高级统计模型（V2）针对每个事件名的聚合 */
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

/** B 模式就绪性评估报告 */
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

// ---- 常量 ----
export const ACTIVE_SESSION_KEY = 'dailyActionActiveSession';
export const durationBuckets = [5, 15, 30, 60, 120, 240];

/** 语义时间槽 → 一天内分钟数 */
export const roughSlotDefaults: Record<RoughTimeSlot, number> = {
  清晨: 390,
  上午: 600,
  中午: 750,
  下午: 900,
  傍晚: 1110,
  晚上: 1200,
  深夜: 1410,
  吃完晚饭后: 1140,
};

/** 语义时长 → 分钟数 */
export const roughDurationDefaults: Record<RoughDurationWord, number> = {
  很快: 5,
  一会: 20,
  一阵: 45,
  一个多小时: 90,
  一下午: 240,
};

export const roughTimeSlots = Object.keys(roughSlotDefaults) as RoughTimeSlot[];
export const roughDurationWords = Object.keys(roughDurationDefaults) as RoughDurationWord[];
export const pieColors = [
  '#2563eb',
  '#16a34a',
  '#eab308',
  '#ec4899',
  '#8b5cf6',
  '#f97316',
  '#14b8a6',
  '#64748b',
];

// ---- 基础工具 ----

/** DateKey → Date（当天 0:00） */
export function dateByKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1, 0, 0, 0, 0);
}

/** 钳位事件起止时间到指定日期范围内，返回 ISO + durationMin */
export function clampEventRange(
  dateKey: string,
  startAt: Date,
  endAt: Date,
): { startAtIso: string; endAtIso: string; durationMin: number } {
  const dayStart = dateByKey(dateKey);
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 0, 0);
  const safeStart = new Date(Math.max(dayStart.getTime(), Math.min(dayEnd.getTime(), startAt.getTime())));
  const safeEnd = new Date(
    Math.max(safeStart.getTime() + 60000, Math.min(dayEnd.getTime(), endAt.getTime())),
  );
  return {
    startAtIso: safeStart.toISOString(),
    endAtIso: safeEnd.toISOString(),
    durationMin: calcDurationMin(safeStart.toISOString(), safeEnd.toISOString()),
  };
}

/** 获得事件的实际经过分钟数（若无 endAt 则取到 now） */
export function getEventDurationMin(event: DailyActionEvent, now: Date): number {
  if (event.endAt) return event.durationMin;
  const diff = now.getTime() - new Date(event.startAt).getTime();
  return Math.max(1, Math.round(diff / 60000));
}

// ---- 统计 ----

/** 基础统计：每个事件名的平均值 */
export function buildNameStats(
  events: DailyActionEvent[],
): Map<string, { count: number; avgStartMin: number; avgDurationMin: number }> {
  const bucket = new Map<string, { starts: number[]; durations: number[] }>();
  for (const event of events) {
    const start = new Date(event.startAt);
    if (Number.isNaN(start.getTime())) continue;
    const startMin = start.getHours() * 60 + start.getMinutes();
    if (!bucket.has(event.name)) bucket.set(event.name, { starts: [], durations: [] });
    const hit = bucket.get(event.name)!;
    hit.starts.push(startMin);
    hit.durations.push(Math.max(1, event.durationMin));
  }
  const result = new Map<string, { count: number; avgStartMin: number; avgDurationMin: number }>();
  bucket.forEach((value, key) => {
    result.set(key, {
      count: value.starts.length,
      avgStartMin: Math.round(value.starts.reduce((s, x) => s + x, 0) / value.starts.length),
      avgDurationMin: Math.round(value.durations.reduce((s, x) => s + x, 0) / value.durations.length),
    });
  });
  return result;
}

/** 分位数 */
function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const next = sorted[base + 1] ?? sorted[base];
  return Math.round(sorted[base] + rest * (next - sorted[base]));
}

/** 均值 */
function mean(values: number[]): number {
  return values.length ? values.reduce((s, x) => s + x, 0) / values.length : 0;
}

/** 标准化事件名（去空格） */
function normalizeActionName(name: string): string {
  return name.trim().replace(/\s+/g, '');
}

/** 高级统计 V2：聚合每个事件名的详细指标 */
export function buildNameStatsV2(
  events: DailyActionEvent[],
  now: Date,
  recentWindowDays = 7,
): Map<string, NameStatsV2> {
  const nowTs = now.getTime();
  const recentMs = recentWindowDays * 24 * 60 * 60 * 1000;
  const bucket = new Map<
    string,
    {
      starts: number[];
      durations: number[];
      recentStarts: number[];
      recentDurations: number[];
      lastSeenTs: number;
    }
  >();
  for (const event of events) {
    const normalized = normalizeActionName(event.name);
    if (!normalized) continue;
    const start = new Date(event.startAt);
    if (Number.isNaN(start.getTime())) continue;
    const startMin = start.getHours() * 60 + start.getMinutes();
    const durationMin = Math.max(1, event.durationMin);
    if (!bucket.has(normalized))
      bucket.set(normalized, {
        starts: [],
        durations: [],
        recentStarts: [],
        recentDurations: [],
        lastSeenTs: 0,
      });
    const hit = bucket.get(normalized)!;
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
    result.set(key, {
      count: value.starts.length,
      recentCount: value.recentStarts.length,
      avgStartMin: Math.round(mean(value.starts)),
      avgDurationMin: Math.round(mean(value.durations)),
      recentAvgStartMin: value.recentStarts.length > 0 ? Math.round(mean(value.recentStarts)) : null,
      recentAvgDurationMin: value.recentDurations.length > 0 ? Math.round(mean(value.recentDurations)) : null,
      medianStartMin: quantile(sortedStarts, 0.5),
      p25DurationMin: quantile(sortedDurations, 0.25),
      p75DurationMin: quantile(sortedDurations, 0.75),
      lastSeenAt: new Date(value.lastSeenTs).toISOString(),
    });
  });
  return result;
}

/** 评估 B 模式（高级统计）是否就绪 */
export function assessBReadiness(
  events: DailyActionEvent[],
  now: Date,
  options?: Partial<BReadinessReport['thresholds']>,
): BReadinessReport {
  const thresholds = {
    minTotalEvents: options?.minTotalEvents ?? 40,
    minDistinctNames: options?.minDistinctNames ?? 6,
    minQualifiedNames: options?.minQualifiedNames ?? 3,
    minRecentEvents: options?.minRecentEvents ?? 12,
    minPerNameEvents: options?.minPerNameEvents ?? 5,
    recentWindowDays: options?.recentWindowDays ?? 7,
  };
  const recentMs = thresholds.recentWindowDays * 24 * 60 * 60 * 1000;
  const nameCounts = new Map<string, number>();
  let recentEvents = 0;
  for (const event of events) {
    const normalized = normalizeActionName(event.name);
    if (!normalized) continue;
    nameCounts.set(normalized, (nameCounts.get(normalized) ?? 0) + 1);
    const startTs = new Date(event.startAt).getTime();
    if (!Number.isNaN(startTs) && now.getTime() - startTs <= recentMs) recentEvents += 1;
  }
  const totalEvents = events.length;
  const distinctNames = nameCounts.size;
  const qualifiedNames = [...nameCounts.values()].filter((c) => c >= thresholds.minPerNameEvents).length;
  const missing: string[] = [];
  if (totalEvents < thresholds.minTotalEvents)
    missing.push(`总样本不足（${totalEvents}/${thresholds.minTotalEvents}）`);
  if (distinctNames < thresholds.minDistinctNames)
    missing.push(`事件类型不足（${distinctNames}/${thresholds.minDistinctNames}）`);
  if (qualifiedNames < thresholds.minQualifiedNames)
    missing.push(`稳定事件不足（${qualifiedNames}/${thresholds.minQualifiedNames}）`);
  if (recentEvents < thresholds.minRecentEvents)
    missing.push(`近期样本不足（${recentEvents}/${thresholds.minRecentEvents}）`);
  const score = [
    totalEvents >= thresholds.minTotalEvents,
    distinctNames >= thresholds.minDistinctNames,
    qualifiedNames >= thresholds.minQualifiedNames,
    recentEvents >= thresholds.minRecentEvents,
  ].filter(Boolean).length;
  return {
    ready: score >= 4,
    score,
    requiredScore: 4,
    metrics: { totalEvents, distinctNames, qualifiedNames, recentEvents },
    thresholds,
    missing,
  };
}

/** B 模式候选生成 */
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
  const strictStartBase = strictHistory
    ? (strictHistory.recentAvgStartMin ?? strictHistory.medianStartMin)
    : null;
  const strictDurationBase = strictHistory
    ? (strictHistory.recentAvgDurationMin ?? strictHistory.avgDurationMin)
    : null;
  const fallbackStart = fallbackHistory?.avgStartMin ?? slotCenter;
  const fallbackDuration = fallbackHistory?.avgDurationMin ?? args.baseDurationMin;
  const centerStartRaw =
    strictReady && strictStartBase !== null
      ? Math.round(strictStartBase * 0.7 + slotCenter * 0.3)
      : Math.round((fallbackStart + slotCenter) / 2);
  const centerDurationRaw =
    strictReady && strictDurationBase !== null
      ? Math.round(strictDurationBase * 0.7 + args.baseDurationMin * 0.3)
      : Math.round((fallbackDuration + args.baseDurationMin) / 2);
  const shortDurationRaw =
    strictReady && strictHistory ? strictHistory.p25DurationMin : Math.round(centerDurationRaw * 0.7);
  const longDurationRaw =
    strictReady && strictHistory ? strictHistory.p75DurationMin : Math.round(centerDurationRaw * 1.3);
  const mainDuration = nearestBucket(centerDurationRaw);
  const shortDuration = nearestBucket(Math.max(5, shortDurationRaw));
  const longDuration = nearestBucket(Math.max(shortDuration, longDurationRaw));
  const earlyShift = args.fuzzySlot === '上午' ? -30 : -20;
  const lateShift = args.fuzzySlot === '吃完晚饭后' ? 20 : 30;
  const MIN = 5 * 60;
  const MAX = 23 * 60 + 40;
  const sourceText = strictReady
    ? `B统计(${strictHistory?.count}条)`
    : fallbackHistory
      ? `均值预热(${fallbackHistory.count}条)`
      : '规则默认';
  return [
    {
      key: 'candidate-main',
      label: '推荐',
      startMin: clamp(centerStartRaw, MIN, MAX),
      durationMin: mainDuration,
      reason: sourceText,
    },
    {
      key: 'candidate-short',
      label: '偏短',
      startMin: clamp(centerStartRaw + earlyShift, MIN, MAX),
      durationMin: shortDuration,
      reason: strictReady ? 'P25分位时长' : '保守短时长估计',
    },
    {
      key: 'candidate-long',
      label: '偏长',
      startMin: clamp(centerStartRaw + lateShift, MIN, MAX),
      durationMin: longDuration,
      reason: strictReady ? 'P75分位时长' : '宽松长时长估计',
    },
  ];
}

/** 取最接近的时长桶 */
export function nearestBucket(value: number): number {
  return durationBuckets.reduce(
    (best, item) => (Math.abs(item - value) < Math.abs(best - value) ? item : best),
    durationBuckets[0],
  );
}
