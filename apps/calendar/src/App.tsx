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
import layout from './App.module.css';
import calendar from './components/Calendar/Calendar.module.css';

type Panel = 'reminder' | 'deadline' | 'tasks' | 'actions' | 'sync';

function App() {
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [activeSidebarPanel, setActiveSidebarPanel] = useState<Panel | null>(null);
  const [panelWidth, setPanelWidth] = useState(360);
  const panelContainerRef = useRef<HTMLDivElement | null>(null);

  const prevWeek = () => setViewDate(d => addDays(d, -7));
  const nextWeek = () => setViewDate(d => addDays(d, 7));
  const goToday = () => setViewDate(new Date());
  const togglePanel = (panel: Panel) => {
    setActiveSidebarPanel(prev => (prev === panel ? null : panel));
  };

  useEffect(() => {
    const container = panelContainerRef.current;
    if (!container) return;
    const activePanel = container.querySelector<HTMLElement>(`[data-panel="${activeSidebarPanel}"]`);
    if (!activePanel) return;
    const content = activePanel.querySelector<HTMLElement>(`[data-panel-body]`) || activePanel;
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
      <div className={layout.container}>
        <h1>学习日历与待办</h1>

        <div className={layout.topActions}>
          <div className={layout.calendarActions}>
            <button id="prevWeek" onClick={prevWeek}>上一周</button>
            <button id="goToday" onClick={goToday}>今天</button>
            <button id="nextWeek" onClick={nextWeek}>下一周</button>
          </div>
          <div className="course-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button id="addCourseBtn" onClick={() => setIsCourseModalOpen(true)}>添加课程</button>
            <CourseImporter />
          </div>
        </div>

        <section className={calendar.section}>
          <WeekView viewDate={viewDate} />
        </section>

        {activeSidebarPanel && <div className={layout.sidebarMask} onClick={() => setActiveSidebarPanel(null)} />}
        <div className={layout.sidebarDock}>
          <nav className={`${layout.sidebarNav}${activeSidebarPanel ? ` ${layout.panelOpen}` : ''}`}>
            <a href="../../index.html" className={`${layout.sidebarNavItem} ${layout.sidebarHomeLink}`} data-tooltip="返回主页" aria-label="返回主页">
              <ArrowLeftIcon />
            </a>
            <div className={layout.sidebarNavDivider}></div>
            {([
              ['reminder', '手机日历', CalendarIcon],
              ['deadline', '作业截止', ClockIcon],
              ['tasks', '待办任务', CheckSquareIcon],
              ['actions', '行动记录', ActionIcon],
              ['sync', '云同步', CloudSyncIcon],
            ] as const).map(([panel, tooltip, Icon]) => (
              <button
                key={panel}
                className={`${layout.sidebarNavItem} ${activeSidebarPanel === panel ? layout.active : ''}`}
                onClick={() => togglePanel(panel)}
                data-tooltip={tooltip}
                aria-label={tooltip}
              >
                <Icon />
              </button>
            ))}
          </nav>
          <div className={`${layout.sidebarPanelContainer} ${activeSidebarPanel ? layout.open : ''}`} ref={panelContainerRef} style={panelWidthStyle}>
            <section className={`${layout.sidebarPanel} ${activeSidebarPanel === 'reminder' ? layout.active : ''}`} data-panel="reminder">
              <div className={layout.sidebarPanelBody} data-panel-body>
                <CourseReminderPanel />
              </div>
            </section>
            <section className={`${layout.sidebarPanel} ${activeSidebarPanel === 'deadline' ? layout.active : ''}`} data-panel="deadline">
              <div className={layout.sidebarPanelBody} data-panel-body>
                <DeadlineCapturePanel />
              </div>
            </section>
            <section className={`${layout.sidebarPanel} ${activeSidebarPanel === 'tasks' ? layout.active : ''}`} data-panel="tasks">
              <div className={layout.sidebarPanelBody} data-panel-body>
                <div className={layout.split}>
                  <TaskList />
                </div>
              </div>
            </section>
            <section className={`${layout.sidebarPanel} ${activeSidebarPanel === 'actions' ? layout.active : ''}`} data-panel="actions">
              <div className={layout.sidebarPanelBody} data-panel-body>
                <DailyActionPanel />
              </div>
            </section>
            <section className={`${layout.sidebarPanel} ${activeSidebarPanel === 'sync' ? layout.active : ''}`} data-panel="sync">
              <div className={layout.sidebarPanelBody} data-panel-body>
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
