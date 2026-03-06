import React from 'react';
import { useStorage } from '../../context/StorageContext';
import { getWeekStart, addDays, getWeekNumber, formatDateLabel } from '../../utils/time';
import { DayColumn } from './DayColumn';
import { TimeGrid } from './TimeGrid';

interface WeekViewProps {
  viewDate: Date;
}

export const WeekView: React.FC<WeekViewProps> = ({ viewDate }) => {
  const { courses, focusSessions } = useStorage();

  const weekStart = getWeekStart(viewDate);
  const weekNumber = getWeekNumber(weekStart);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i);
    days.push(d);
  }

  return (
    <div className="calendar-section">
      <div className="calendar-header">
        <span style={{ margin: '0 10px' }}>
          第 {weekNumber} 周 ({formatDateLabel(weekStart)} - {formatDateLabel(addDays(weekStart, 6))})
        </span>
      </div>

      <div className="calendar-grid">
        <TimeGrid />
        {days.map((date) => (
          <DayColumn
            key={date.toISOString()}
            date={date}
            dayIndex={date.getDay()}
            courses={courses}
            focusSessions={focusSessions}
            onCourseClick={c => alert(`课程: ${c.title}`)}
            onSessionClick={s => alert(`专注: ${s.title}`)}
          />
        ))}
      </div>
    </div>
  );
};
