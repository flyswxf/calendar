import React, { useEffect, useState } from 'react';
import { useStorage } from '../../context/useStorage';
import { addDays, getWeekStart, pad, parseHM, toDateKey } from '../../utils/time';

const EXPORT_KEY = 'courseReminderExportWeek';
const LEGACY_PREF_KEY = 'courseReminderPrefs';

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function readExportWeek(): number {
  try {
    const stored = localStorage.getItem(EXPORT_KEY);
    if (stored) return clampNumber(Number(stored) || 20, 1, 30);
    const legacy = localStorage.getItem(LEGACY_PREF_KEY);
    if (!legacy) return 20;
    const parsed = JSON.parse(legacy) as { exportUntilWeek?: number };
    return clampNumber(Number(parsed.exportUntilWeek) || 20, 1, 30);
  } catch {
    return 20;
  }
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

export const CourseReminderPanel: React.FC = () => {
  const { courses, semesterStartDate } = useStorage();
  const [exportUntilWeek, setExportUntilWeek] = useState(readExportWeek());
  const [message, setMessage] = useState('');

  useEffect(() => {
    localStorage.setItem(EXPORT_KEY, String(exportUntilWeek));
  }, [exportUntilWeek]);

  const exportICS = () => {
    if (!semesterStartDate) {
      setMessage('请先在周视图把当前周设置为正确周次，再导出日历。');
      return;
    }
    if (courses.length === 0) {
      setMessage('当前没有课程数据可导出。');
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
        lines.push('END:VEVENT');
        eventCount++;
      }
    }

    lines.push('END:VCALENDAR');

    if (eventCount === 0) {
      setMessage('没有可导出的未来课程。');
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
    setMessage(`已导出 ${eventCount} 个课程日程到 .ics`);
  };

  return (
    <section className="course-reminder-panel">
      <div className="course-reminder-header">
        <div className="course-reminder-title">
          <h3>手机日历导出</h3>
          <p>将课程表导出为 .ics日历文件</p>
        </div>
      </div>

      <div className="course-reminder-card">
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
          <button className="course-reminder-btn primary" onClick={exportICS}>导出 .ics（手机日历）</button>
        </div>
      </div>

      {message && <div className="course-reminder-message">{message}</div>}
    </section>
  );
};
