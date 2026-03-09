import React from 'react';
import { Course, DeadlineEvent, FocusSession } from '../../types';
import { EventBlock } from './EventBlock';
import { parseHM, toDateKey } from '../../utils/time';

interface DayColumnProps {
  date: Date;
  dayIndex: number; // 0-6 (Sun-Sat)
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
  onDeadlineClick
}) => {
  // Filter courses for this day of week
  const dayCourses = courses.filter(c => {
    // If c.day is 1 (Mon), it matches dayIndex 1.
    // If c.day is 7 (Sun), it matches dayIndex 0.
    const courseDay = parseInt(String(c.day));
    if (dayIndex === 0) return courseDay === 7;
    return courseDay === dayIndex;
  });

  // Filter focus sessions for this specific date
  const dateKey = toDateKey(date);
  const isToday = dateKey === toDateKey(new Date());

  const daySessions = focusSessions.filter(s => {
    const sessionDate = new Date(s.start);
    return toDateKey(sessionDate) === dateKey;
  });

  const dayDeadlines = deadlineEvents.filter((event) => {
    const dueDate = new Date(event.dueAt);
    return toDateKey(dueDate) === dateKey;
  });

  return (
    <div className={`day-col${isToday ? ' today' : ''}`} data-day={dayIndex}>
      <div className="day-header">
        {['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dayIndex]}
        <br/>
        <span className="date-label">{date.getDate()}</span>
      </div>
      <div className="day-body" style={{ position: 'relative', height: '100%' }}>
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
        {dayDeadlines.map((event) => {
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
