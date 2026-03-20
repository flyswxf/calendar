import { useEffect, useMemo, useState } from 'react';
import { useStorage } from '../../context/useStorage';
import type { DailyActionEvent } from '../../types';
import { getWeekNumber, getWeekStart, parseHM, toDateKey } from '../../utils/time';
import {
  ACTIVE_SESSION_KEY,
  buildNameStats,
  Candidate,
  clamp,
  clampEventRange,
  dateWithMinutes,
  getEventDurationMin,
  nearestBucket,
  roughDurationDefaults,
  RoughDurationWord,
  roughSlotDefaults,
  RoughTimeSlot,
  pieColors,
  ActiveSession,
  EditDraft
} from './dailyActionShared';

export function useDailyActionPanel() {
  const { dailyActionEvents, setDailyActionEvents, courses, semesterStartDate } = useStorage();
  const [now, setNow] = useState(() => new Date());
  const [manualName, setManualName] = useState('');
  const [manualHour, setManualHour] = useState(now.getHours());
  const [manualMinute, setManualMinute] = useState(Math.floor(now.getMinutes() / 5) * 5);
  const [manualDurationMin, setManualDurationMin] = useState(30);
  const [fuzzyName, setFuzzyName] = useState('');
  const [fuzzySlot, setFuzzySlot] = useState<RoughTimeSlot>('下午');
  const [fuzzyDurationWord, setFuzzyDurationWord] = useState<RoughDurationWord>('一会');
  const [selectedCandidateKey, setSelectedCandidateKey] = useState('candidate-main');
  const [runningName, setRunningName] = useState('');
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [adjustEndHour, setAdjustEndHour] = useState(now.getHours());
  const [adjustEndMinute, setAdjustEndMinute] = useState(Math.floor(now.getMinutes() / 5) * 5);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const todayKey = toDateKey(now);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ActiveSession;
      if (parsed?.name && parsed?.startAt && parsed?.dateKey) {
        setActiveSession(parsed);
      }
    } catch {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  }, []);

  useEffect(() => {
    if (!activeSession) return;
    if (activeSession.dateKey !== todayKey) return;
    const current = new Date();
    setAdjustEndHour(current.getHours());
    setAdjustEndMinute(Math.floor(current.getMinutes() / 5) * 5);
  }, [activeSession, todayKey]);

  useEffect(() => {
    const today = new Date();
    const day = today.getDay() === 0 ? 7 : today.getDay();
    const todayDateKey = toDateKey(today);
    const todayWeekNumber = semesterStartDate ? getWeekNumber(getWeekStart(today)) : null;
    const nextEvents: DailyActionEvent[] = [];
    for (const course of courses) {
      if (course.day !== day) continue;
      if (todayWeekNumber && Array.isArray(course.weeks) && course.weeks.length > 0 && !course.weeks.includes(todayWeekNumber)) continue;
      const courseStartMin = parseHM(course.start);
      const courseEndMin = parseHM(course.end);
      const startAt = dateWithMinutes(today, courseStartMin);
      const endAt = dateWithMinutes(today, courseEndMin);
      if (now.getTime() < endAt.getTime()) continue;
      const autoCourseKey = `${todayDateKey}-${course.id}-${course.start}-${course.end}`;
      nextEvents.push({
        id: crypto.randomUUID(),
        name: `上课:${course.title}`,
        source: 'auto_calendar',
        confidence: 'exact',
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        durationMin: Math.max(1, Math.round((endAt.getTime() - startAt.getTime()) / 60000)),
        dateKey: todayDateKey,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        autoCourseKey
      });
    }
    if (nextEvents.length > 0) {
      setDailyActionEvents((prev) => {
        const existsKeys = new Set(prev.map((item) => item.autoCourseKey).filter(Boolean));
        const filtered = nextEvents.filter((item) => !existsKeys.has(item.autoCourseKey));
        if (filtered.length === 0) return prev;
        return [...prev, ...filtered].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
      });
    }
  }, [courses, now, semesterStartDate, setDailyActionEvents]);

  const todayEvents = useMemo(() => {
    return dailyActionEvents
      .filter((event) => event.dateKey === todayKey)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [dailyActionEvents, todayKey]);

  const nameSuggestions = useMemo(() => {
    const counter = new Map<string, number>();
    for (const event of dailyActionEvents) {
      const hit = counter.get(event.name) ?? 0;
      counter.set(event.name, hit + 1);
    }
    return [...counter.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name).slice(0, 12);
  }, [dailyActionEvents]);

  const nameStats = useMemo(() => buildNameStats(dailyActionEvents), [dailyActionEvents]);

  const fuzzyCandidates = useMemo(() => {
    const history = fuzzyName ? nameStats.get(fuzzyName) : null;
    const isEarlyClassDay = now.getDay() === 3 || now.getDay() === 4;
    const dinnerEndMinutes = todayEvents
      .filter((event) => event.endAt && (event.name.includes('晚饭') || event.name.includes('吃饭')))
      .map((event) => {
        const d = new Date(event.endAt as string);
        return d.getHours() * 60 + d.getMinutes();
      });
    const dinnerAnchor = dinnerEndMinutes.length > 0 ? Math.max(...dinnerEndMinutes) + 10 : roughSlotDefaults.吃完晚饭后;
    const slotCenterRaw = fuzzySlot === '吃完晚饭后' ? dinnerAnchor : roughSlotDefaults[fuzzySlot];
    const slotCenter = fuzzySlot === '上午' && isEarlyClassDay ? slotCenterRaw - 75 : slotCenterRaw;
    const durationCenter = roughDurationDefaults[fuzzyDurationWord];
    const baseStart = history ? Math.round((slotCenter + history.avgStartMin) / 2) : slotCenter;
    const baseDuration = history ? Math.round((durationCenter + history.avgDurationMin) / 2) : durationCenter;
    const mainDuration = nearestBucket(baseDuration);
    const shortDuration = nearestBucket(Math.round(mainDuration * 0.7));
    const longDuration = nearestBucket(Math.round(mainDuration * 1.3));
    const earlyShift = fuzzySlot === '上午' ? -30 : -20;
    const lateShift = fuzzySlot === '吃完晚饭后' ? 20 : 30;
    const minStart = 5 * 60;
    const maxStart = 23 * 60 + 40;
    const mainStart = clamp(baseStart, minStart, maxStart);
    const shortStart = clamp(mainStart + earlyShift, minStart, maxStart);
    const longStart = clamp(mainStart + lateShift, minStart, maxStart);
    const sourceText = history ? '融合历史习惯' : '根据语义默认值';
    const historyText = history ? `（${fuzzyName} 已记录 ${history.count} 次）` : '';
    return [
      {
        key: 'candidate-main',
        label: '推荐',
        startMin: mainStart,
        durationMin: mainDuration,
        reason: `${sourceText}${historyText}`
      },
      {
        key: 'candidate-short',
        label: '偏短',
        startMin: shortStart,
        durationMin: shortDuration,
        reason: '更保守的短时长估计'
      },
      {
        key: 'candidate-long',
        label: '偏长',
        startMin: longStart,
        durationMin: longDuration,
        reason: '更宽松的长时长估计'
      }
    ] satisfies Candidate[];
  }, [fuzzyDurationWord, fuzzyName, fuzzySlot, nameStats, now, todayEvents]);

  useEffect(() => {
    setSelectedCandidateKey('candidate-main');
  }, [fuzzyName, fuzzySlot, fuzzyDurationWord]);

  const summaryItems = useMemo(() => {
    const map = new Map<string, number>();
    for (const event of todayEvents) {
      const duration = getEventDurationMin(event, now);
      const next = (map.get(event.name) ?? 0) + duration;
      map.set(event.name, next);
    }
    const rows = [...map.entries()]
      .map(([name, durationMin]) => ({ name, durationMin }))
      .sort((a, b) => b.durationMin - a.durationMin);
    const total = rows.reduce((sum, row) => sum + row.durationMin, 0);
    return { rows, total };
  }, [todayEvents, now]);

  const pieGradient = useMemo(() => {
    if (summaryItems.total <= 0) return '#e2e8f0';
    let cursor = 0;
    const parts = summaryItems.rows.map((row, index) => {
      const percent = (row.durationMin / summaryItems.total) * 100;
      const from = cursor;
      const to = cursor + percent;
      cursor = to;
      const color = pieColors[index % pieColors.length];
      return `${color} ${from}% ${to}%`;
    });
    return `conic-gradient(${parts.join(', ')})`;
  }, [summaryItems]);

  const handleAddManual = () => {
    const name = manualName.trim();
    if (!name) return;
    const startMin = manualHour * 60 + manualMinute;
    const startAt = dateWithMinutes(now, startMin);
    const endAt = new Date(startAt.getTime() + manualDurationMin * 60000);
    const normalized = clampEventRange(todayKey, startAt, endAt);
    const eventItem: DailyActionEvent = {
      id: crypto.randomUUID(),
      name,
      source: 'manual',
      confidence: 'exact',
      startAt: normalized.startAtIso,
      endAt: normalized.endAtIso,
      durationMin: normalized.durationMin,
      dateKey: todayKey,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setDailyActionEvents((prev) => [...prev, eventItem].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()));
    setManualName('');
  };

  const handleStartSession = () => {
    const name = runningName.trim();
    if (!name) return;
    const session: ActiveSession = {
      name,
      startAt: new Date().toISOString(),
      dateKey: todayKey
    };
    setActiveSession(session);
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
  };

  const handleEndSession = () => {
    if (!activeSession) return;
    const sessionStart = new Date(activeSession.startAt);
    const endDate = new Date(sessionStart);
    endDate.setHours(adjustEndHour, adjustEndMinute, 0, 0);
    if (endDate.getTime() <= sessionStart.getTime()) {
      endDate.setTime(sessionStart.getTime() + 5 * 60000);
    }
    const normalized = clampEventRange(activeSession.dateKey, sessionStart, endDate);
    const eventItem: DailyActionEvent = {
      id: crypto.randomUUID(),
      name: activeSession.name,
      source: 'timer',
      confidence: 'adjusted',
      startAt: normalized.startAtIso,
      endAt: normalized.endAtIso,
      durationMin: normalized.durationMin,
      dateKey: activeSession.dateKey,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setDailyActionEvents((prev) => [...prev, eventItem].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()));
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    setActiveSession(null);
    setRunningName('');
  };

  const handleAddFromCandidate = () => {
    const name = fuzzyName.trim();
    if (!name) return;
    const selected = fuzzyCandidates.find((candidate) => candidate.key === selectedCandidateKey) ?? fuzzyCandidates[0];
    const startAt = dateWithMinutes(now, selected.startMin);
    const endAt = new Date(startAt.getTime() + selected.durationMin * 60000);
    const normalized = clampEventRange(todayKey, startAt, endAt);
    const eventItem: DailyActionEvent = {
      id: crypto.randomUUID(),
      name,
      source: 'fuzzy',
      confidence: 'fuzzy',
      startAt: normalized.startAtIso,
      endAt: normalized.endAtIso,
      durationMin: normalized.durationMin,
      dateKey: todayKey,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setDailyActionEvents((prev) => [...prev, eventItem].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()));
    setFuzzyName('');
  };

  const handleDelete = (id: string) => {
    setDailyActionEvents((prev) => prev.filter((event) => event.id !== id));
    if (editDraft?.id === id) {
      setEditDraft(null);
    }
  };

  const handleStartEdit = (event: DailyActionEvent) => {
    const start = new Date(event.startAt);
    setEditDraft({
      id: event.id,
      name: event.name,
      startHour: start.getHours(),
      startMinute: Math.floor(start.getMinutes() / 5) * 5,
      durationMin: nearestBucket(event.durationMin)
    });
  };

  const handleSaveEdit = () => {
    if (!editDraft) return;
    const name = editDraft.name.trim();
    if (!name) return;
    setDailyActionEvents((prev) => prev.map((event) => {
      if (event.id !== editDraft.id) return event;
      const startAt = dateWithMinutes(now, editDraft.startHour * 60 + editDraft.startMinute);
      const endAt = new Date(startAt.getTime() + editDraft.durationMin * 60000);
      const normalized = clampEventRange(event.dateKey, startAt, endAt);
      const confidence: DailyActionEvent['confidence'] = event.source === 'fuzzy' ? 'fuzzy' : 'adjusted';
      return {
        ...event,
        name,
        startAt: normalized.startAtIso,
        endAt: normalized.endAtIso,
        durationMin: normalized.durationMin,
        confidence,
        updatedAt: Date.now()
      };
    }).sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()));
    setEditDraft(null);
  };

  return {
    now,
    todayKey,
    todayEvents,
    nameSuggestions,
    fuzzyCandidates,
    summaryItems,
    pieGradient,
    manualName,
    setManualName,
    manualHour,
    setManualHour,
    manualMinute,
    setManualMinute,
    manualDurationMin,
    setManualDurationMin,
    fuzzyName,
    setFuzzyName,
    fuzzySlot,
    setFuzzySlot,
    fuzzyDurationWord,
    setFuzzyDurationWord,
    selectedCandidateKey,
    setSelectedCandidateKey,
    runningName,
    setRunningName,
    activeSession,
    adjustEndHour,
    setAdjustEndHour,
    adjustEndMinute,
    setAdjustEndMinute,
    editDraft,
    setEditDraft,
    handleAddManual,
    handleStartSession,
    handleEndSession,
    handleAddFromCandidate,
    handleDelete,
    handleStartEdit,
    handleSaveEdit
  };
}
