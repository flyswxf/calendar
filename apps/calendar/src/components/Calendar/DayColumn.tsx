/**
 * 单日列组件
 * 过滤并渲染当天的课程/专注/截止事件
 */
import React from 'react';
import { Course, DeadlineEvent, FocusSession } from '../../types';
import { EventBlock } from './EventBlock';
import { parseHM, toDateKey } from '../../utils/time';
import styles from './Calendar.module.css';

const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

interface DayColumnProps {
  date: Date;
  dayIndex: number; // 0=Sun
  courses: Course[];
  focusSessions: FocusSession[];
  deadlineEvents: DeadlineEvent[];
  onCourseClick?: (course: Course) => void;
  onSessionClick?: (session: FocusSession) => void;
  onDeadlineClick?: (event: DeadlineEvent) => void;
}

export const DayColumn: React.FC<DayColumnProps> = ({
  date,
  dayIndex,
  courses,
  focusSessions,
  deadlineEvents,
  onCourseClick,
  onSessionClick,
  onDeadlineClick,
}) => {
  // 过滤属于本天的课程（day=0 表示周日也映射到 dayIndex=0）
  const dayCourses = courses.filter((c) => {
    const courseDay = parseInt(String(c.day));
    if (dayIndex === 0) return courseDay === 7;
    return courseDay === dayIndex;
  });

  const dateKey = toDateKey(date);
  const isToday = dateKey === toDateKey(new Date());

  // 过滤属于本天的专注会话
  const daySessions = focusSessions.filter((s) => toDateKey(new Date(s.start)) === dateKey);
  // 过滤属于本天的截止事件
  const dayDeadlines = deadlineEvents.filter((event) => toDateKey(new Date(event.dueAt)) === dateKey);

  return (
    <div className={`${styles.dayCol}${isToday ? ` ${styles.today}` : ''}`} data-day={dayIndex}>
      <div className={styles.dayHeader}>
        {DAY_NAMES[dayIndex]}
        <br />
        <span>{date.getDate()}</span>
      </div>
      <div className={styles.dayBody} style={{ position: 'relative', height: '100%' }}>
        {dayCourses.map((course) => (
          <EventBlock
            key={course.id}
            title={course.title}
            startMin={parseHM(course.start)}
            endMin={parseHM(course.end)}
            type="course"
            location={course.location}
            teacher={course.teacher}
            onClick={() => onCourseClick?.(course)}
          />
        ))}
        {daySessions.map((session) => {
          const start = new Date(session.start);
          const end = new Date(session.end);
          return (
            <EventBlock
              key={session.id}
              title={session.title}
              startMin={start.getHours() * 60 + start.getMinutes()}
              endMin={end.getHours() * 60 + end.getMinutes()}
              type="focus"
              onClick={() => onSessionClick?.(session)}
            />
          );
        })}
        {dayDeadlines.map((event) => {
          const due = new Date(event.dueAt);
          // 截止事件设为截止前 30 分钟的色块
          return (
            <EventBlock
              key={event.id}
              title={`📅 ${event.title}`}
              startMin={Math.max(0, due.getHours() * 60 + due.getMinutes() - 30)}
              endMin={due.getHours() * 60 + due.getMinutes()}
              type="deadline"
              onClick={() => onDeadlineClick?.(event)}
            />
          );
        })}
      </div>
    </div>
  );
};
