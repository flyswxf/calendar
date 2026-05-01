/**
 * 应用根组件
 * 负责：周视图日历/侧边栏面板切换/课程导入入口
 */
import { useEffect, useRef, useState, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { WeekView } from './components/Calendar/WeekView';
import { TaskList } from './components/Tasks/TaskList';
import { CourseModal } from './components/Modals/CourseModal';
import { CourseImporter } from './components/Calendar/CourseImporter';
import { CourseReminderPanel } from './components/Calendar/CourseReminderPanel';
import { DeadlineCapturePanel } from './components/Deadline/DeadlineCapturePanel';
import { DailyActionPanel } from './components/DailyAction/DailyActionPanel';
import { SupabaseAuthCard } from './components/Auth/SupabaseAuthCard';
import ArrowLeftIcon from './components/Icon/ArrowLeftIcon';
import ActionIcon from './components/Icon/ActionIcon';
import CalendarIcon from './components/Icon/CalendarIcon';
import ClockIcon from './components/Icon/ClockIcon';
import CheckSquareIcon from './components/Icon/CheckSquareIcon';
import CloudSyncIcon from './components/Icon/CloudSyncIcon';
import { addDays } from './utils/time';
import layout from './App.module.css';
import calendar from './components/Calendar/Calendar.module.css';

type Panel = 'reminder' | 'deadline' | 'tasks' | 'actions' | 'sync';

/** 侧边栏面板配置：key → 内容组件 + 图标 + 提示 */
const PANELS = [
  {
    key: 'reminder' as Panel,
    label: '手机日历',
    Icon: CalendarIcon,
    Component: CourseReminderPanel,
  },
  {
    key: 'deadline' as Panel,
    label: '作业截止',
    Icon: ClockIcon,
    Component: DeadlineCapturePanel,
  },
  {
    key: 'tasks' as Panel,
    label: '待办任务',
    Icon: CheckSquareIcon,
    Component: TaskList,
  },
  {
    key: 'actions' as Panel,
    label: '行动记录',
    Icon: ActionIcon,
    Component: DailyActionPanel,
  },
  {
    key: 'sync' as Panel,
    label: '云同步',
    Icon: CloudSyncIcon,
    Component: SupabaseAuthCard,
  },
] as const;

function App() {
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [activeSidebarPanel, setActiveSidebarPanel] = useState<Panel | null>(null);
  const [panelWidth, setPanelWidth] = useState(360);
  const panelContainerRef = useRef<HTMLDivElement | null>(null);

  const prevWeek = () => setViewDate((d) => addDays(d, -7));
  const nextWeek = () => setViewDate((d) => addDays(d, 7));
  const goToday = () => setViewDate(new Date());
  const togglePanel = (panel: Panel) => setActiveSidebarPanel((prev) => (prev === panel ? null : panel));

  // 自适应面板宽度
  useEffect(() => {
    const container = panelContainerRef.current;
    if (!container) return;
    const activePanel = container.querySelector<HTMLElement>(`[data-panel="${activeSidebarPanel}"]`);
    if (!activePanel) return;
    const content = activePanel.querySelector<HTMLElement>(`[data-panel-body]`) || activePanel;
    const measure = () => {
      const contentWidth = Math.ceil(content.scrollWidth || content.getBoundingClientRect().width);
      const next = Math.min(Math.floor(window.innerWidth * 0.9), Math.max(280, contentWidth + 50));
      setPanelWidth(next);
    };
    window.requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, [activeSidebarPanel]);

  const panelStyle = useMemo(() => ({ '--panel-width': `${panelWidth}px` }) as CSSProperties, [panelWidth]);

  return (
    <>
      <div className={layout.container}>
        <h1>学习日历与待办</h1>

        {/* 顶部操作栏：周导航 + 课程按钮 */}
        <div className={layout.topActions}>
          <div className={layout.calendarActions}>
            <button id="prevWeek" onClick={prevWeek}>
              上一周
            </button>
            <button id="goToday" onClick={goToday}>
              今天
            </button>
            <button id="nextWeek" onClick={nextWeek}>
              下一周
            </button>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button id="addCourseBtn" onClick={() => setIsCourseModalOpen(true)}>
              添加课程
            </button>
            <CourseImporter />
          </div>
        </div>

        {/* 周视图日历网格 */}
        <section className={calendar.section}>
          <WeekView viewDate={viewDate} />
        </section>

        {/* 侧边栏容器 */}
        {activeSidebarPanel && (
          <div className={layout.sidebarMask} onClick={() => setActiveSidebarPanel(null)} />
        )}
        <div className={layout.sidebarDock}>
          {/* 侧边导航 */}
          <nav className={`${layout.sidebarNav}${activeSidebarPanel ? ` ${layout.panelOpen}` : ''}`}>
            <a
              href="../../index.html"
              className={`${layout.sidebarNavItem} ${layout.sidebarHomeLink}`}
              data-tooltip="返回主页"
              aria-label="返回主页"
            >
              <ArrowLeftIcon />
            </a>
            <div className={layout.sidebarNavDivider}></div>
            {PANELS.map(({ key, label, Icon }) => (
              <button
                key={key}
                className={`${layout.sidebarNavItem} ${activeSidebarPanel === key ? layout.active : ''}`}
                onClick={() => togglePanel(key)}
                data-tooltip={label}
                aria-label={label}
              >
                <Icon />
              </button>
            ))}
          </nav>

          {/* 面板内容区 */}
          <div
            className={`${layout.sidebarPanelContainer} ${activeSidebarPanel ? layout.open : ''}`}
            ref={panelContainerRef}
            style={panelStyle}
          >
            {PANELS.map(({ key, Component }) => (
              <section
                key={key}
                className={`${layout.sidebarPanel} ${activeSidebarPanel === key ? layout.active : ''}`}
                data-panel={key}
              >
                <div className={layout.sidebarPanelBody} data-panel-body>
                  <Component />
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>

      {isCourseModalOpen && (
        <CourseModal isOpen={isCourseModalOpen} onClose={() => setIsCourseModalOpen(false)} />
      )}
    </>
  );
}

export default App;
