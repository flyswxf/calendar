import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStorage } from '../../context/StorageContext';
import { addDays, getWeekStart, pad, parseHM, toDateKey } from '../../utils/time';

const PREF_KEY = 'courseReminderPrefs';
const TRIGGER_KEY = 'courseReminderTriggered';

type ReminderPrefs = {
  enabled: boolean;
  minutesBefore: number;
  soundEnabled: boolean;
  exportUntilWeek: number;
  collapsed: boolean;
};

const DEFAULT_PREFS: ReminderPrefs = {
  enabled: false,
  minutesBefore: 10,
  soundEnabled: true,
  exportUntilWeek: 20,
  collapsed: false
};

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function readPrefs(): ReminderPrefs {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<ReminderPrefs>;
    return {
      enabled: Boolean(parsed.enabled),
      minutesBefore: clampNumber(Number(parsed.minutesBefore) || DEFAULT_PREFS.minutesBefore, 1, 120),
      soundEnabled: parsed.soundEnabled ?? true,
      exportUntilWeek: clampNumber(Number(parsed.exportUntilWeek) || DEFAULT_PREFS.exportUntilWeek, 1, 30),
      collapsed: Boolean(parsed.collapsed)
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function parseTriggeredSet(): Set<string> {
  try {
    const raw = localStorage.getItem(TRIGGER_KEY);
    if (!raw) return new Set<string>();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set<string>();
    return new Set(arr.filter((item): item is string => typeof item === 'string'));
  } catch {
    return new Set<string>();
  }
}

function saveTriggeredSet(set: Set<string>) {
  localStorage.setItem(TRIGGER_KEY, JSON.stringify(Array.from(set)));
}

function formatDateTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getCurrentWeekNumber(today: Date, semesterStartDate: string | null): number {
  if (!semesterStartDate) return 1;
  const semStart = getWeekStart(new Date(semesterStartDate));
  const currentWeekStart = getWeekStart(today);
  const diffDays = Math.floor((currentWeekStart.getTime() - semStart.getTime()) / (24 * 3600 * 1000));
  return Math.floor(diffDays / 7) + 1;
}

function buildCourseDate(baseDate: Date, hm: string): Date {
  const mins = parseHM(hm);
  const d = new Date(baseDate);
  d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
  return d;
}

function toICSDate(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

function escapeICS(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function playReminderSound() {
  const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const ctx = new AudioContextClass();
  const now = ctx.currentTime;
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = i % 2 === 0 ? 880 : 660;
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const startAt = now + i * 0.35;
    gain.gain.exponentialRampToValueAtTime(0.2, startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.16);
    osc.start(startAt);
    osc.stop(startAt + 0.18);
  }
  window.setTimeout(() => {
    void ctx.close();
  }, 1500);
}

export const CourseReminderPanel: React.FC = () => {
  const { courses, semesterStartDate } = useStorage();
  const initialPrefs = useMemo(() => readPrefs(), []);
  const [enabled, setEnabled] = useState(initialPrefs.enabled);
  const [minutesBefore, setMinutesBefore] = useState(initialPrefs.minutesBefore);
  const [soundEnabled, setSoundEnabled] = useState(initialPrefs.soundEnabled);
  const [exportUntilWeek, setExportUntilWeek] = useState(initialPrefs.exportUntilWeek);
  const [collapsed, setCollapsed] = useState(initialPrefs.collapsed);
  const [lastMessage, setLastMessage] = useState('');
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );
  const triggeredRef = useRef<Set<string>>(parseTriggeredSet());

  useEffect(() => {
    const prefs: ReminderPrefs = { enabled, minutesBefore, soundEnabled, exportUntilWeek, collapsed };
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  }, [enabled, minutesBefore, soundEnabled, exportUntilWeek, collapsed]);

  useEffect(() => {
    const today = toDateKey(new Date());
    const keep = new Set<string>();
    for (const key of triggeredRef.current) {
      const dateKey = key.split('|')[0];
      if (dateKey >= today) keep.add(key);
    }
    triggeredRef.current = keep;
    saveTriggeredSet(keep);
  }, []);

  const todayOccurrences = useMemo(() => {
    const now = new Date();
    const currentWeek = getCurrentWeekNumber(now, semesterStartDate);
    const dayIndex = now.getDay();
    const courseDay = dayIndex === 0 ? 7 : dayIndex;
    return courses
      .filter((course) => {
        if (course.day !== courseDay) return false;
        if (!course.weeks || course.weeks.length === 0) return true;
        return course.weeks.includes(currentWeek);
      })
      .map((course) => {
        const startAt = buildCourseDate(now, course.start);
        const endAt = buildCourseDate(now, course.end);
        return {
          uniqueKey: `${toDateKey(now)}|${course.id}|${course.start}|${minutesBefore}`,
          course,
          startAt,
          endAt
        };
      })
      .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  }, [courses, semesterStartDate, minutesBefore]);

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setInterval(() => {
      const now = new Date();
      for (const item of todayOccurrences) {
        const triggerTime = new Date(item.startAt.getTime() - minutesBefore * 60 * 1000);
        if (now < triggerTime || now >= item.startAt) continue;
        if (triggeredRef.current.has(item.uniqueKey)) continue;

        triggeredRef.current.add(item.uniqueKey);
        saveTriggeredSet(triggeredRef.current);

        if (soundEnabled) playReminderSound();

        const title = `⏰ ${minutesBefore}分钟后上课：${item.course.title}`;
        const body = `${formatDateTime(item.startAt)}-${formatDateTime(item.endAt)}  ${item.course.location || '未知地点'}`;
        if (permission === 'granted' && 'Notification' in window) {
          const n = new Notification(title, { body });
          n.onclick = () => window.focus();
        } else {
          alert(`${title}\n${body}`);
        }
        setLastMessage(`${toDateKey(now)} ${formatDateTime(now)} 已提醒：${item.course.title}`);
      }
    }, 15000);

    return () => window.clearInterval(timer);
  }, [enabled, minutesBefore, permission, soundEnabled, todayOccurrences]);

  const nextCourseText = useMemo(() => {
    const now = Date.now();
    const next = todayOccurrences.find((item) => item.startAt.getTime() > now);
    if (!next) return '今天没有待开始课程';
    return `下一节：${next.course.title} ${formatDateTime(next.startAt)}（${next.course.location || '未知地点'}）`;
  }, [todayOccurrences]);

  const permissionText = permission === 'granted'
    ? '已授权'
    : permission === 'denied'
      ? '已拒绝'
      : permission === 'default'
        ? '未选择'
        : '不支持';

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      setPermission('unsupported');
      setLastMessage('当前浏览器不支持系统通知');
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    setLastMessage(result === 'granted' ? '系统通知已开启' : '系统通知未授权，将使用弹窗提醒');
  };

  const triggerTest = () => {
    if (soundEnabled) playReminderSound();
    if (permission === 'granted' && 'Notification' in window) {
      const n = new Notification('测试提醒', { body: '课前提醒功能正常可用' });
      n.onclick = () => window.focus();
    } else {
      alert('测试提醒：课前提醒功能正常可用');
    }
    setLastMessage('已发送测试提醒');
  };

  const exportICS = () => {
    if (!semesterStartDate) {
      alert('请先在周视图把当前周设置为正确周次，再导出日历。');
      return;
    }
    if (courses.length === 0) {
      alert('当前没有课程数据可导出。');
      return;
    }

    const semStart = getWeekStart(new Date(semesterStartDate));
    const now = new Date();
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//todo_list//course-reminder//CN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    let eventCount = 0;
    for (const course of courses) {
      const targetWeeks = course.weeks && course.weeks.length > 0
        ? course.weeks.filter((w) => w > 0 && w <= exportUntilWeek)
        : Array.from({ length: exportUntilWeek }, (_, i) => i + 1);

      for (const week of targetWeeks) {
        const dayOffset = course.day === 7 ? 6 : course.day - 1;
        const baseDate = addDays(semStart, (week - 1) * 7 + dayOffset);
        const startAt = buildCourseDate(baseDate, course.start);
        const endAt = buildCourseDate(baseDate, course.end);
        if (endAt < now) continue;
        const uid = `${course.id}-${toDateKey(baseDate)}-${course.start}@todo-list.local`;
        const dtStamp = toICSDate(new Date());
        const description = escapeICS(`地点：${course.location || '未知地点'}\n教师：${course.teacher || '未填写'}\n周次：第${week}周`);

        lines.push('BEGIN:VEVENT');
        lines.push(`UID:${uid}`);
        lines.push(`DTSTAMP:${dtStamp}`);
        lines.push(`DTSTART:${toICSDate(startAt)}`);
        lines.push(`DTEND:${toICSDate(endAt)}`);
        lines.push(`SUMMARY:${escapeICS(`课程：${course.title}`)}`);
        lines.push(`DESCRIPTION:${description}`);
        lines.push(`LOCATION:${escapeICS(course.location || '未知地点')}`);
        lines.push('BEGIN:VALARM');
        lines.push('ACTION:DISPLAY');
        lines.push(`DESCRIPTION:${escapeICS(`${course.title} 即将开始`)}`);
        lines.push(`TRIGGER:-PT${minutesBefore}M`);
        lines.push('END:VALARM');
        lines.push('END:VEVENT');
        eventCount++;
      }
    }

    lines.push('END:VCALENDAR');

    if (eventCount === 0) {
      alert('没有可导出的未来课程。');
      return;
    }

    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fileDate = toDateKey(new Date()).replace(/-/g, '');
    a.href = url;
    a.download = `course-reminders-${fileDate}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setLastMessage(`已导出 ${eventCount} 个课程日程到 .ics`);
  };

  return (
    <section className="course-reminder-panel">
      <div className="course-reminder-header">
        <div className="course-reminder-title">
          <h3>课程提醒</h3>
          <p>课前提醒 + 手机日历同步</p>
        </div>
        <div className="course-reminder-header-right">
          <span className={`course-reminder-permission ${permission === 'granted' ? 'ok' : 'pending'}`}>
            通知权限：{permissionText}
          </span>
          <button
            type="button"
            className="course-reminder-btn course-reminder-toggle"
            onClick={() => setCollapsed((prev) => !prev)}
          >
            {collapsed ? '展开面板' : '收起面板'}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="course-reminder-grid">
            <div className="course-reminder-card">
              <div className="course-reminder-card-title">网页提醒</div>
              <div className="course-reminder-controls">
                <label className="course-reminder-switch">
                  <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
                  启用网页提醒
                </label>
                <label className="course-reminder-inline">
                  <span>提前</span>
                  <input
                    className="course-reminder-input"
                    type="number"
                    min={1}
                    max={120}
                    value={minutesBefore}
                    onChange={(e) => setMinutesBefore(clampNumber(Number(e.target.value) || 10, 1, 120))}
                  />
                  <span>分钟</span>
                </label>
                <label className="course-reminder-switch">
                  <input type="checkbox" checked={soundEnabled} onChange={(e) => setSoundEnabled(e.target.checked)} />
                  启用响铃
                </label>
              </div>
              <div className="course-reminder-actions">
                <button className="course-reminder-btn primary" onClick={requestPermission}>开启系统通知</button>
                <button className="course-reminder-btn" onClick={triggerTest}>测试提醒</button>
              </div>
            </div>

            <div className="course-reminder-card">
              <div className="course-reminder-card-title">手机日历导出</div>
              <div className="course-reminder-controls">
                <label className="course-reminder-inline">
                  <span>导出到第</span>
                  <input
                    className="course-reminder-input"
                    type="number"
                    min={1}
                    max={30}
                    value={exportUntilWeek}
                    onChange={(e) => setExportUntilWeek(clampNumber(Number(e.target.value) || 20, 1, 30))}
                  />
                  <span>周</span>
                </label>
              </div>
              <div className="course-reminder-actions">
                <button className="course-reminder-btn primary" onClick={exportICS}>导出 .ics（华为/Outlook/Google）</button>
              </div>
            </div>
          </div>

          <div className="course-reminder-foot">
            <div>{nextCourseText}</div>
            {lastMessage && <div className="course-reminder-last">{lastMessage}</div>}
          </div>
        </>
      )}
    </section>
  );
};
