// 项目入口：初始化各模块并绑定事件

import { queryDOM } from './modules/dom/domRefs.js';
import { loadTasks, loadCourses, loadFocusSessions, setSyncUserId, loadAllFromRemote } from './modules/storage/index.js';
import { renderCalendar, bindWeekNav, alignTimeColumn } from './modules/calendar/calendar.js';
import { bindCourseModal } from './modules/courses/modal.js';
import { renderTasks, bindTaskInputs, scheduleNextCleanup, checkInitialCleanup } from './modules/tasks/tasks.js';
import { initTimer, stopTimerFromExit } from './modules/timer/timer.js';
import { bindCloseModalButtons } from './modules/modals/modals.js';

window.addEventListener('DOMContentLoaded', async () => {
  const dom = queryDOM();
  const url = new URL(window.location.href);
  const uid = url.searchParams.get('uid');
  if (uid) setSyncUserId(uid);
  await loadAllFromRemote();
  loadTasks(); loadCourses(); loadFocusSessions();

  // 初始化日历与导航
  renderCalendar(dom);
  bindWeekNav(dom);
  alignTimeColumn(dom);

  // 课程弹窗绑定
  bindCourseModal(dom);

  // 统一绑定所有 X 关闭按钮（包含课程弹窗、详情弹窗、计时器退出）
  bindCloseModalButtons(dom, () => stopTimerFromExit(dom));

  // 待办
  renderTasks(dom);
  bindTaskInputs(dom);
  checkInitialCleanup(dom);
  scheduleNextCleanup(dom);

  // 计时器
  initTimer(dom);
  dom.exitTimerBtn?.addEventListener('click', () => stopTimerFromExit(dom));

  // 窗口事件
  window.addEventListener('resize', () => alignTimeColumn(dom));
});