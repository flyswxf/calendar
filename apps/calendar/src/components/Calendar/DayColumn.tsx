import React from 'react';
import { Course, DeadlineEvent, FocusSession } from '../../types';
import { EventBlock } from './EventBlock';
import { parseHM, toDateKey } from '../../utils/time';
import styles from './Calendar.module.css';

interface DayColumnProps {
  date: Date;
  dayIndex: number;
  courses: Course[];
  focusSessions: FocusSession[];
  deadlineEvents: DeadlineEvent[];
  onCourseClick?: (course: Course) => void;
  onSessionClick?: (session: FocusSession) => void;
  onDeadlineClick?: (event: DeadlineEvent) => void;
}

const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export const DayColumn: React.FC<DayColumnProps> = ({
  date,
  dayIndex,
  courses,
  focusSessions,
  deadlineEvents,
  onCourseClick,
  onSessionClick,
  onDeadlineClick
}) => {
  const dayCourses = courses.filter(c => {
    const courseDay = parseInt(String(c.day));
    if (dayIndex === 0) return courseDay === 7;
    return courseDay === dayIndex;
  });

  const dateKey = toDateKey(date);
  const isToday = dateKey === toDateKey(new Date());

  const daySessions = focusSessions.filter(s => {
    const sessionDate = new Date(s.start);
    return toDateKey(sessionDate) === dateKey;
  });

  const dayDeadlines = deadlineEvents.filter(event => {
    const dueDate = new Date(event.dueAt);
    return toDateKey(dueDate) === dateKey;
  });

  return (
    <div className={`${styles.dayCol}${isToday ? ` ${styles.today}` : ''}`} data-day={dayIndex}>
      <div className={styles.dayHeader}>
        {DAY_NAMES[dayIndex]}
        <br />
        <span>{date.getDate()}</span>
      </div>
      <div className={styles.dayBody} style={{ position: 'relative', height: '100%' }}>
        {dayCourses.map(course => (
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
        {daySessions.map(session => {
          const start = new Date(session.start);
          const end = new Date(session.end);
          const startMin = start.getHours() * 60 + start.getMinutes();
          const endMin = end.getHours() * 60 + end.getMinutes();
          return (
            <EventBlock
              key={session.id}
              title={session.title}
              startMin={startMin}
              endMin={endMin}
              type="focus"
              onClick={() => onSessionClick?.(session)}
            />
          );
        })}
        {dayDeadlines.map(event => {
          const due = new Date(event.dueAt);
          const startMin = due.getHours() * 60 + due.getMinutes();
          const endMin = Math.min(startMin + 30, 23 * 60);
          return (
            <EventBlock
              key={event.id}
              title={event.title}
              startMin={startMin}
              endMin={Math.max(endMin, startMin + 1)}
              type="deadline"
              location={event.courseName}
              onClick={() => onDeadlineClick?.(event)}
            />
          );
        })}
      </div>
    </div>
  );
};
