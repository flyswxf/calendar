import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { WeekView } from './components/Calendar/WeekView';
import { TaskList } from './components/Tasks/TaskList';
import { CourseModal } from './components/Modals/CourseModal';
import { CourseImporter } from './components/Calendar/CourseImporter';
import { CourseReminderPanel } from './components/Calendar/CourseReminderPanel';
import { DeadlineCapturePanel } from './components/Deadline/DeadlineCapturePanel';
import { DailyActionPanel } from './components/DailyAction/DailyActionPanel';
import ArrowLeftIcon from './components/Icon/ArrowLeftIcon';
import ActionIcon from './components/Icon/ActionIcon';
import CalendarIcon from './components/Icon/CalendarIcon';
import ClockIcon from './components/Icon/ClockIcon';
import CheckSquareIcon from './components/Icon/CheckSquareIcon';
import CloudSyncIcon from './components/Icon/CloudSyncIcon';
import { addDays } from './utils/time';
import { SupabaseAuthCard } from './components/Auth/SupabaseAuthCard';

function App() {
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [activeSidebarPanel, setActiveSidebarPanel] = useState<'reminder' | 'deadline' | 'tasks' | 'actions' | 'sync' | null>(null);
  const [panelWidth, setPanelWidth] = useState(360);
  const panelContainerRef = useRef<HTMLDivElement | null>(null);

  const prevWeek = () => setViewDate(d => addDays(d, -7));
  const nextWeek = () => setViewDate(d => addDays(d, 7));
  const goToday = () => setViewDate(new Date());
  const togglePanel = (panel: 'reminder' | 'deadline' | 'tasks' | 'actions' | 'sync') => {
    setActiveSidebarPanel(prev => (prev === panel ? null : panel));
  };

  useEffect(() => {
    const container = panelContainerRef.current;
    if (!container) return;
    const activePanel = container.querySelector<HTMLElement>('.sidebar-panel.active');
    if (!activePanel) return;
    const content = activePanel.querySelector<HTMLElement>('.sidebar-panel-body') || activePanel;
    const updateWidth = () => {
      const contentWidth = Math.ceil(content.scrollWidth || content.getBoundingClientRect().width);
      const extraSpace = 50;
      const minWidth = 280;
      const maxWidth = Math.floor(window.innerWidth * 0.9);
      const nextWidth = Math.min(maxWidth, Math.max(minWidth, contentWidth + extraSpace));
      setPanelWidth(nextWidth);
    };
    const scheduleMeasure = () => {
      window.requestAnimationFrame(updateWidth);
    };
    scheduleMeasure();
    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(content);
    return () => observer.disconnect();
  }, [activeSidebarPanel]);

  const panelWidthStyle = { '--panel-width': `${panelWidth}px` } as CSSProperties;

  return (
    <>
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

        <section className="calendar-section">
          <WeekView viewDate={viewDate} />
        </section>

        {activeSidebarPanel && <div className="sidebar-mask" onClick={() => setActiveSidebarPanel(null)} />}
        <div className="sidebar-dock">
          <nav className="sidebar-nav">
            <a href="../../index.html" className="sidebar-nav-item sidebar-home-link" data-tooltip="返回主页" aria-label="返回主页">
              <ArrowLeftIcon />
            </a>
            <div className="sidebar-nav-divider"></div>
            <button
              className={`sidebar-nav-item ${activeSidebarPanel === 'reminder' ? 'active' : ''}`}
              onClick={() => togglePanel('reminder')}
              data-tooltip="手机日历"
              aria-label="手机日历"
            >
              <CalendarIcon />
            </button>
            <button
              className={`sidebar-nav-item ${activeSidebarPanel === 'deadline' ? 'active' : ''}`}
              onClick={() => togglePanel('deadline')}
              data-tooltip="作业截止"
              aria-label="作业截止"
            >
              <ClockIcon />
            </button>
            <button
              className={`sidebar-nav-item ${activeSidebarPanel === 'tasks' ? 'active' : ''}`}
              onClick={() => togglePanel('tasks')}
              data-tooltip="待办任务"
              aria-label="待办任务"
            >
              <CheckSquareIcon />
            </button>
            <button
              className={`sidebar-nav-item ${activeSidebarPanel === 'actions' ? 'active' : ''}`}
              onClick={() => togglePanel('actions')}
              data-tooltip="行动记录"
              aria-label="行动记录"
            >
              <ActionIcon />
            </button>
            <button
              className={`sidebar-nav-item ${activeSidebarPanel === 'sync' ? 'active' : ''}`}
              onClick={() => togglePanel('sync')}
              data-tooltip="云同步"
              aria-label="云同步"
            >
              <CloudSyncIcon />
            </button>
          </nav>
          <div className={`sidebar-panel-container ${activeSidebarPanel ? 'open' : ''}`} ref={panelContainerRef} style={panelWidthStyle}>
            <section className={`sidebar-panel ${activeSidebarPanel === 'reminder' ? 'active' : ''}`}>
              <div className="sidebar-panel-body">
                <CourseReminderPanel />
              </div>
            </section>
            <section className={`sidebar-panel ${activeSidebarPanel === 'deadline' ? 'active' : ''}`}>
              <div className="sidebar-panel-body">
                <DeadlineCapturePanel />
              </div>
            </section>
            <section className={`sidebar-panel ${activeSidebarPanel === 'tasks' ? 'active' : ''}`}>
              <div className="sidebar-panel-body">
                <div className="split">
                  <TaskList />
                </div>
              </div>
            </section>
            <section className={`sidebar-panel ${activeSidebarPanel === 'actions' ? 'active' : ''}`}>
              <div className="sidebar-panel-body">
                <DailyActionPanel />
              </div>
            </section>
            <section className={`sidebar-panel ${activeSidebarPanel === 'sync' ? 'active' : ''}`}>
              <div className="sidebar-panel-body">
                <SupabaseAuthCard />
              </div>
            </section>
          </div>
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
