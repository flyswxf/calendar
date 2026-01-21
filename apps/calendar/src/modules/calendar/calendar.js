/**
 * 日历渲染模块。
 * 负责周头渲染、课程与专注任务展示、当前时间线与今日高亮等。
 */

import { BASE_START_MIN, END_MIN, getPixelPerMin, fmtTime, fmtHM, formatDateLabel, toDateKey, getWeekStart, addDays, parseHM, getWeekNumber, weekMatchesCourse } from '../utils/time.js';
import { courses, focusSessions } from '../storage/index.js';
import { openModal } from '../modals/modals.js';

let viewDate = new Date();

function createEventEl(dom, { title, startMin, endMin, type, location, detail }) {
  const el = document.createElement('div');
  el.className = `event ${type}`;
  const pixelPerMin = getPixelPerMin();
  const top = Math.max(0, (startMin - BASE_START_MIN) * pixelPerMin);
  const height = Math.max(18, (endMin - startMin) * pixelPerMin);
  el.style.top = `${top}px`;
  el.style.height = `${height}px`;

  const titleEl = document.createElement('span');
  titleEl.className = 'title';
  titleEl.textContent = title;

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = `${fmtHM(startMin)} - ${fmtHM(endMin)}`;

  el.appendChild(titleEl);
  el.appendChild(meta);

  if (detail) {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => openEventDetail(dom, detail));
  } else if (type === 'focus') {
    el.addEventListener('click', () => {
      openEventDetail(dom, {
        title: title,
        start: fmtHM(startMin),
        end: fmtHM(endMin),
        location: location || '',
        duration: Math.round((endMin - startMin)),
        type: '专注任务'
      });
    });
    el.style.cursor = 'pointer';
  }

  return el;
}

export function renderTimeCol(dom) {
  dom.timeCol.innerHTML = '';
  // 7:00 到 22:00 每小时一个刻度，保证与右侧16小时范围对齐
  for (let h = 7; h < 23; h++) {
    if (h === 23) break;
    const slot = document.createElement('div');
    slot.className = 'time-slot';
    slot.textContent = fmtTime(h, 0);
    dom.timeCol.appendChild(slot);
  }
  // 底部补充 23:00 标签，不增加额外分隔线
  const endLabel = document.createElement('div');
  endLabel.className = 'time-end';
  endLabel.textContent = fmtTime(23, 0);
  dom.timeCol.appendChild(endLabel);
}

function clearDayBodies(dom) {
  dom.dayBodies.forEach(body => body.innerHTML = '');
  dom.dayCols.forEach(col => col.classList.remove('today'));
}

function renderWeekHeader(dom, weekStart) {
  const weekEnd = addDays(weekStart, 6);
  const w = getWeekNumber(weekStart);
  const wLabel = w >= 1 ? `（第${w}周）` : '（开学前）';
  dom.calendarWeekLabel.textContent = `${formatDateLabel(weekStart)} - ${formatDateLabel(weekEnd)} ${wLabel}`;
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i);
    const weekday = ["周一","周二","周三","周四","周五","周六","周日"][i];
    const header = dom.dayHeaders[(i+1)%7]; // DOM结构中0是周日放最后
    if (header) header.textContent = `${weekday} ${d.getMonth()+1}/${d.getDate()}`;
  }
}

function renderNowLine(weekStart) {
  const now = new Date();
  const todayStart = getWeekStart(now);
  if (todayStart.getTime() !== weekStart.getTime()) return;
  const dayIndex = now.getDay();
  const body = document.getElementById(`dayBody-${dayIndex}`);
  const minutes = now.getHours()*60 + now.getMinutes();
  if (minutes < BASE_START_MIN || minutes > END_MIN) return;
  const line = document.createElement('div');
  line.className = 'now-line';
  line.style.top = `${(minutes - BASE_START_MIN) * getPixelPerMin()}px`;
  body.appendChild(line);
}

function renderCourses(dom, weekStart) {
  const w = getWeekNumber(weekStart);
  courses.forEach(c => {
    if (!weekMatchesCourse(w, c.weeks)) return;
    const day = Number(c.day);
    const body = document.getElementById(`dayBody-${day}`);
    if (!body) return;
    const startMin = parseHM(c.start);
    const endMin = parseHM(c.end);
    const el = createEventEl(dom, {
      title: c.title || '课程',
      startMin, endMin,
      type: 'course',
      location: c.location || '',
      detail: {
        title: c.title,
        time: `${c.start} - ${c.end}`,
        location: c.location || '',
        weeks: c.weeks || null
      }
    });
    body.appendChild(el);
  });
}

function renderFocusSessions(dom, weekStart) {
  const weekEnd = addDays(weekStart, 6);
  // 按天分组专注任务，用于重叠检测
  const sessionsByDay = { 0:[],1:[],2:[],3:[],4:[],5:[],6:[] };

  focusSessions.forEach(s => {
    const start = new Date(s.start);
    const end = new Date(s.end);
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const inRange = d >= weekStart && d <= weekEnd;
    if (!inRange) return;
    const day = d.getDay();
    const startMin = start.getHours()*60 + start.getMinutes();
    const endMin = end.getHours()*60 + end.getMinutes();
    sessionsByDay[day].push({ session:s, startMin, endMin, start, end });
  });

  Object.keys(sessionsByDay).forEach(day => {
    const sessions = sessionsByDay[day];
    if (sessions.length === 0) return;
    const body = document.getElementById(`dayBody-${day}`);

    const columns = [];
    sessions.forEach(sessionData => {
      let columnIndex = 0;
      while (columnIndex < columns.length) {
        const hasOverlap = columns[columnIndex].some(existing =>
          !(sessionData.endMin <= existing.startMin || sessionData.startMin >= existing.endMin)
        );
        if (!hasOverlap) break;
        columnIndex++;
      }
      if (columnIndex >= columns.length) columns.push([]);
      columns[columnIndex].push(sessionData);
    });

    columns.forEach((column, colIndex) => {
      column.forEach(sessionData => {
        const { session: s, startMin, endMin, start, end } = sessionData;
        const el = createEventEl(dom, {
          title: s.taskTitle || '专注任务',
          startMin,
          endMin,
          type: 'focus',
          location: '',
          detail: {
            title: s.taskTitle || '专注任务',
            start: fmtHM(startMin),
            end: fmtHM(endMin),
            duration: Math.round((end - start) / 60000),
            completed: s.completed
          }
        });
        const totalColumns = columns.length;
        if (totalColumns > 1) {
          const width = Math.floor(95 / totalColumns);
          const leftOffset = colIndex * width;
          el.style.width = `${width}%`;
          el.style.left = `${2 + leftOffset}%`;
          el.style.right = 'auto';
        }
        body.appendChild(el);
      });
    });
  });
}

function renderTodayHighlight(dom, weekStart) {
  const now = new Date();
  const start = getWeekStart(now);
  if (start.getTime() !== weekStart.getTime()) return;
  const day = now.getDay();
  const col = dom.dayCols.find(c => c.getAttribute('data-day') === String(day));
  if (col) col.classList.add('today');
}

export function renderCalendar(dom) {
  const weekStart = getWeekStart(viewDate);
  clearDayBodies(dom);
  // 渲染左侧时间刻度
  renderTimeCol(dom);
  renderWeekHeader(dom, weekStart);
  renderCourses(dom, weekStart);
  renderFocusSessions(dom, weekStart);
  renderTodayHighlight(dom, weekStart);
  renderNowLine(weekStart);
  setTimeout(() => alignTimeColumn(dom), 5);
}

export function setViewDate(d) { viewDate = d; }
export function getViewDate() { return viewDate; }

export function weeksToText(weeks){
  if (!weeks) return '全学期';
  const p = weeks.parity === 'odd' ? '（单周）' : weeks.parity === 'even' ? '（双周）' : '';
  return `第${weeks.start}-${weeks.end}周${p}`;
}

export function openEventDetail(dom, detail){
  dom.detailTitle.textContent = detail.title || '';
  dom.detailTime.textContent = detail.time || '';
  dom.detailLocation.textContent = detail.location || '';
  dom.detailWeeks.textContent = weeksToText(detail.weeks);
  openModal(dom.eventDetailModal);
}

export function alignTimeColumn(dom) {
  const dayHeader = document.querySelector('.day-header');
  const timeCol = document.querySelector('.time-col');
  if (dayHeader && timeCol) {
    const headerHeight = dayHeader.offsetHeight;
    timeCol.style.marginTop = `${headerHeight}px`;
  }
}

export function bindWeekNav(dom) {
  dom.prevWeekBtn?.addEventListener('click', () => { setViewDate(addDays(getWeekStart(getViewDate()), -7)); renderCalendar(dom); });
  dom.nextWeekBtn?.addEventListener('click', () => { setViewDate(addDays(getWeekStart(getViewDate()), 7)); renderCalendar(dom); });
  dom.goTodayBtn?.addEventListener('click', () => { setViewDate(new Date()); renderCalendar(dom); });
}