import React from 'react';
import { useStorage } from '../../context/StorageContext';
import { getWeekStart, addDays, getWeekNumber, formatDateLabel, toDateKey } from '../../utils/time';
import { DayColumn } from './DayColumn';
import { TimeGrid } from './TimeGrid';

interface WeekViewProps {
  viewDate: Date;
}

export const WeekView: React.FC<WeekViewProps> = ({ viewDate }) => {
  const { courses, focusSessions, semesterStartDate, setSemesterStartDate } = useStorage();

  const weekStart = getWeekStart(viewDate);
  
  // Calculate week number dynamically based on semesterStartDate
  let weekNumber = 1;
  if (semesterStartDate) {
    const semStart = getWeekStart(new Date(semesterStartDate));
    const diffDays = Math.floor((weekStart.getTime() - semStart.getTime()) / (24 * 3600 * 1000));
    weekNumber = Math.floor(diffDays / 7) + 1;
  } else {
    // Fallback: If no semester start set, use getWeekNumber from utils (which might use a hardcoded date)
    // or just default to 1 and prompt user to set it.
    weekNumber = getWeekNumber(weekStart); 
  }

  // Filter courses based on current week
  const filteredCourses = courses.filter(course => {
    // If course has no weeks defined, show it always (or never? usually always)
    if (!course.weeks || course.weeks.length === 0) return true;
    return course.weeks.includes(weekNumber);
  });
  
  const handleSetCurrentWeekAs = (week: number) => {
     // Calculate what the semester start date should be if the current viewDate is 'week'
     // viewDate is in 'weekNumber'.
     // semesterStart = weekStart - (week - 1) weeks
     const newSemStart = addDays(weekStart, -(week - 1) * 7);
     setSemesterStartDate(toDateKey(newSemStart));
     alert(`已将本周设置为第 ${week} 周，开学日期自动更新为 ${formatDateLabel(newSemStart)}`);
  };

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i);
    days.push(d);
  }

  return (
    <div className="calendar-section">
      <div className="calendar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ margin: '0 10px', fontSize: '1.2em', fontWeight: 'bold' }}>
            第 {weekNumber} 周
          </span>
          <span style={{ color: '#666' }}>
             ({formatDateLabel(weekStart)} - {formatDateLabel(addDays(weekStart, 6))})
          </span>
        </div>
        
        <div style={{ fontSize: '0.9em', display: 'flex', gap: '8px', alignItems: 'center' }}>
           <span>设置当前为:</span>
           {[1, 2, 3, 4, 5, 6, 7, 8].map(w => (
              <button 
                key={w}
                onClick={() => handleSetCurrentWeekAs(w)}
                style={{ 
                  padding: '2px 6px', 
                  border: weekNumber === w ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                  background: weekNumber === w ? '#eff6ff' : 'white',
                  color: weekNumber === w ? '#1d4ed8' : '#64748b',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {w}
              </button>
           ))} 
           <button onClick={() => {
              const w = prompt("请输入当前周数(1-30):", String(weekNumber));
              if (w) {
                const num = parseInt(w);
                if (!isNaN(num) && num > 0) handleSetCurrentWeekAs(num);
              }
           }} style={{ padding: '2px 6px', border: '1px solid #e2e8f0', background: 'white', borderRadius: '4px', cursor: 'pointer' }}>...</button>
        </div>
      </div>

      <div className="calendar-grid">
        <TimeGrid />
        {days.map((date) => (
          <DayColumn
            key={date.toISOString()}
            date={date}
            dayIndex={date.getDay()}
            courses={filteredCourses}
            focusSessions={focusSessions}
            onCourseClick={c => alert(`课程: ${c.title}\n地点: ${c.location}\n教师: ${c.teacher || '无'}\n周次: ${c.weeks?.join(',') || '全'}`)}
            onSessionClick={s => alert(`专注: ${s.title}`)}
          />
        ))}
      </div>
    </div>
  );
};
