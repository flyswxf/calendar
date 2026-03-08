import { useState } from 'react';
import { WeekView } from './components/Calendar/WeekView';
import { TaskList } from './components/Tasks/TaskList';
import { CourseModal } from './components/Modals/CourseModal';
import { CourseImporter } from './components/Calendar/CourseImporter';
import { CourseReminderPanel } from './components/Calendar/CourseReminderPanel';
import { addDays } from './utils/time';

function App() {
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  const prevWeek = () => setViewDate(d => addDays(d, -7));
  const nextWeek = () => setViewDate(d => addDays(d, 7));
  const goToday = () => setViewDate(new Date());

  return (
    <>
      <nav className="app-nav">
        <a href="../../index.html" className="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          返回主页
        </a>
      </nav>
      <div className="container">
        <h1>学习日历与待办</h1>

        <div className="top-actions">
          <div className="calendar-actions">
            <button id="prevWeek" onClick={prevWeek}>上一周</button>
            <button id="goToday" onClick={goToday}>今天</button>
            <button id="nextWeek" onClick={nextWeek}>下一周</button>
          </div>
          <div className="course-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button id="addCourseBtn" onClick={() => setIsCourseModalOpen(true)}>添加课程</button>
            <CourseImporter />
          </div>
        </div>

        <CourseReminderPanel />

        <WeekView viewDate={viewDate} />

        <div className="split">
          <TaskList />
        </div>
      </div>

      {isCourseModalOpen && (
        <CourseModal 
          isOpen={isCourseModalOpen} 
          onClose={() => setIsCourseModalOpen(false)} 
        />
      )}
    </>
  );
}

export default App;
