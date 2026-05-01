/**
 * 周视图日历组件
 * 显示 7 天时间网格 + 课程/专注/截止事件 + 周次设置
 */
import React from 'react';
import { useStorage } from '../../context/StorageContext';
import { getWeekStart, addDays, getWeekNumber, formatDateLabel, toDateKey } from '../../utils/time';
import { DayColumn } from './DayColumn';
import { TimeGrid } from './TimeGrid';
import styles from './Calendar.module.css';

interface WeekViewProps {
  viewDate: Date;
}

export const WeekView: React.FC<WeekViewProps> = ({ viewDate }) => {
  const { courses, focusSessions, deadlineEvents, semesterStartDate, setSemesterStartDate } = useStorage();

  // 当前显示的周范围
  const weekStart = getWeekStart(viewDate);

  // 计算当前是第几教学周
  let weekNumber = 1;
  if (semesterStartDate) {
    const semStart = getWeekStart(new Date(semesterStartDate));
    const diffDays = Math.floor((weekStart.getTime() - semStart.getTime()) / (24 * 3600 * 1000));
    weekNumber = Math.floor(diffDays / 7) + 1;
  } else {
    weekNumber = getWeekNumber(weekStart);
  }

  // 过滤出当前周有课的课程
  const filteredCourses = courses.filter((course) => {
    if (!course.weeks || course.weeks.length === 0) return true;
    return course.weeks.includes(weekNumber);
  });

  /** 将当前周设置为指定周次 → 重新推算开学日期 */
  const handleSetCurrentWeekAs = (week: number) => {
    const newSemStart = addDays(weekStart, -(week - 1) * 7);
    setSemesterStartDate(toDateKey(newSemStart));
    alert(`已将本周设置为第 ${week} 周，开学日期自动更新为 ${formatDateLabel(newSemStart)}`);
  };

  // 生成周一到周日
  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(weekStart, i));
  }

  return (
    <div className={styles.section}>
      {/* 周头部：第X周 + 日期范围 + 快速设周按钮 */}
      <div
        className={styles.header}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <span style={{ margin: '0 10px', fontSize: '1.2em', fontWeight: 'bold' }}>第 {weekNumber} 周</span>
          <span style={{ color: '#666' }}>
            ({formatDateLabel(weekStart)} - {formatDateLabel(addDays(weekStart, 6))})
          </span>
        </div>

        <div
          style={{
            fontSize: '0.9em',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          <span>设置当前为:</span>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((w) => (
            <button
              key={w}
              onClick={() => handleSetCurrentWeekAs(w)}
              style={{
                padding: '2px 6px',
                border: weekNumber === w ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                background: weekNumber === w ? '#eff6ff' : 'white',
                color: weekNumber === w ? '#1d4ed8' : '#64748b',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {w}
            </button>
          ))}
          <button
            onClick={() => {
              const w = prompt('请输入当前周数(1-30):', String(weekNumber));
              if (w) {
                const num = parseInt(w);
                if (!isNaN(num) && num > 0) handleSetCurrentWeekAs(num);
              }
            }}
            style={{
              padding: '2px 6px',
              border: '1px solid #e2e8f0',
              background: 'white',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            ...
          </button>
        </div>
      </div>

      {/* 网格 = 时间标签列 + 7 天列 */}
      <div className={styles.grid}>
        <TimeGrid />
        {days.map((date) => (
          <DayColumn
            key={date.toISOString()}
            date={date}
            dayIndex={date.getDay()}
            courses={filteredCourses}
            focusSessions={focusSessions}
            deadlineEvents={deadlineEvents}
            onCourseClick={(c) =>
              alert(
                `课程: ${c.title}\n地点: ${c.location}\n教师: ${c.teacher || '无'}\n周次: ${c.weeks?.join(',') || '全'}`,
              )
            }
            onSessionClick={(s) => alert(`专注: ${s.title}`)}
            onDeadlineClick={(event) =>
              alert(
                `截止: ${event.title}\n时间: ${new Date(event.dueAt).toLocaleString()}\n课程: ${event.courseName || '未填写'}\n来源: ${event.source}\n说明: ${event.description || '无'}`,
              )
            }
          />
        ))}
      </div>
    </div>
  );
};
