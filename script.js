// ========== DOM 获取 ==========
// 待办
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTask');
const taskList = document.getElementById('taskList');

// 日历与控制
const timeCol = document.getElementById('timeCol');
const calendarWeekLabel = document.getElementById('calendarWeekLabel');
const dayBodies = [0,1,2,3,4,5,6].map(d => document.getElementById(`dayBody-${d}`));
const dayCols = Array.from(document.querySelectorAll('.day-col'));
const dayHeaders = [0,1,2,3,4,5,6].map(d => document.getElementById(`dayHeader-${d}`));

const prevWeekBtn = document.getElementById('prevWeek');
const nextWeekBtn = document.getElementById('nextWeek');
const goTodayBtn = document.getElementById('goToday');

// 课程相关
const addCourseBtn = document.getElementById('addCourseBtn');

const courseModal = document.getElementById('courseModal');
const courseTitleInput = document.getElementById('courseTitle');
const courseDaySelect = document.getElementById('courseDay');
const courseStartInput = document.getElementById('courseStart');
const courseEndInput = document.getElementById('courseEnd');
const courseLocationInput = document.getElementById('courseLocation');
const saveCourseBtn = document.getElementById('saveCourseBtn');



// 计时器
const timerOverlay = document.getElementById('timerOverlay');
const timerTaskTitleEl = document.getElementById('timerTaskTitle');
const exitTimerBtn = document.getElementById('exitTimer');
const startTimerBtn = document.getElementById('startTimer');
const pauseTimerBtn = document.getElementById('pauseTimer');
const resetTimerBtn = document.getElementById('resetTimer');
const finishTimerBtn = document.getElementById('finishTimer');
const stopTimerBtn = document.getElementById('stopTimer');
const runningTimeEl = document.getElementById('runningTime');
const setupMinutesEl = document.getElementById('setupMinutes');
const countdownSetup = document.getElementById('countdownSetup');
const timerModeInputs = document.querySelectorAll('input[name="timerMode"]');

// ========== 本地存储 ==========
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let courses = JSON.parse(localStorage.getItem('courses')) || [];
let focusSessions = JSON.parse(localStorage.getItem('focusSessions')) || [];

function saveTasks() { localStorage.setItem('tasks', JSON.stringify(tasks)); }
function saveCourses() { localStorage.setItem('courses', JSON.stringify(courses)); }
function saveFocusSessions() { localStorage.setItem('focusSessions', JSON.stringify(focusSessions)); }

// ========== 工具函数 ==========
const BASE_START_MIN = 7 * 60; // 7:00
const END_MIN = 23 * 60; // 23:00

// 动态计算PIXEL_PER_MIN，根据屏幕尺寸适配
function getPixelPerMin() {
    if (window.innerWidth <= 480) {
        return 35 / 60; // 超小屏：35px/小时 ≈ 0.583px/分钟
    } else if (window.innerWidth <= 768) {
        return 40 / 60; // 手机端：40px/小时 ≈ 0.667px/分钟
    }
    return 0.8; // 桌面端：48px/小时 = 0.8px/分钟
}
// 学期开始日期：第1周从 2025-09-15 开始（周一）
const SEMESTER_START = new Date(2025, 8, 15);
// 禁用旧版(V1)一次性导入
const DISABLE_V1_IMPORT = true;

function pad(n) { return n < 10 ? '0' + n : '' + n; }
function fmtTime(h, m) { return `${pad(h)}:${pad(m)}`; }
function fmtHM(minutesOfDay) { const h = Math.floor(minutesOfDay / 60); const m = minutesOfDay % 60; return fmtTime(h, m); }
function formatDateLabel(d) { return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())}`; }
function toDateKey(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }

function getWeekStart(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 周日
  const diff = (day === 0 ? -6 : 1 - day); // 回到周一
  d.setDate(d.getDate() + diff);
  d.setHours(0,0,0,0);
  return d;
}

function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }

function parseHM(str) { const [h,m] = str.split(':').map(Number); return h*60 + m; }

function getWeekNumber(weekStart) {
  const semStart = getWeekStart(SEMESTER_START);
  const diffDays = Math.floor((weekStart - semStart) / (24*3600*1000));
  const w = Math.floor(diffDays / 7) + 1;
  return w;
}

function weekMatchesCourse(weekNo, weeks){
  if (!weeks) return true; // 未设置则默认全周
  if (weekNo < weeks.start || weekNo > weeks.end) return false;
  if (weeks.parity === 'odd') return (weekNo % 2) === 1;
  if (weeks.parity === 'even') return (weekNo % 2) === 0;
  return true;
}

function createEventEl({ title, startMin, endMin, type, location, detail }) {
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
  // 只在块内显示时间，不显示地点等详情（点击查看详情）
  meta.textContent = `${fmtHM(startMin)} - ${fmtHM(endMin)}`;

  el.appendChild(titleEl);
  el.appendChild(meta);

  if (detail) {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => openEventDetail(detail));
  } else if (type === 'focus') {
    // 为专注任务添加默认详情
    el.addEventListener('click', () => {
      openEventDetail({
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

// ========== 渲染时间刻度 ==========
function renderTimeCol() {
  timeCol.innerHTML = '';
  for (let h = 7; h <= 23; h++) {
    const slot = document.createElement('div');
    slot.className = 'time-slot';
    slot.textContent = fmtTime(h, 0);
    timeCol.appendChild(slot);
  }
}

// ========== 日历渲染 ==========
let viewDate = new Date();

function clearDayBodies() {
  dayBodies.forEach(body => body.innerHTML = '');
  dayCols.forEach(col => col.classList.remove('today'));
}

function renderWeekHeader(weekStart) {
  const weekEnd = addDays(weekStart, 6);
  const w = getWeekNumber(weekStart);
  const wLabel = w >= 1 ? `（第${w}周）` : '（开学前）';
  calendarWeekLabel.textContent = `${formatDateLabel(weekStart)} - ${formatDateLabel(weekEnd)} ${wLabel}`;
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i);
    const weekday = ["周一","周二","周三","周四","周五","周六","周日"][i];
    const header = dayHeaders[(i+1)%7]; // 我们DOM中0是周日放最后
    if (header) header.textContent = `${weekday} ${d.getMonth()+1}/${d.getDate()}`;
  }
}

function renderNowLine(weekStart) {
  const now = new Date();
  const todayStart = getWeekStart(now);
  if (todayStart.getTime() !== weekStart.getTime()) return; // 本周之外不渲染
  const dayIndex = now.getDay(); // 0..6 (周日..周六)
  const body = document.getElementById(`dayBody-${dayIndex}`);
  const minutes = now.getHours()*60 + now.getMinutes();
  if (minutes < BASE_START_MIN || minutes > END_MIN) return;
  const line = document.createElement('div');
  line.className = 'now-line';
  line.style.top = `${(minutes - BASE_START_MIN) * getPixelPerMin()}px`;
  body.appendChild(line);
}

function renderCourses(weekStart) {
  const w = getWeekNumber(weekStart);
  courses.forEach(c => {
    // 过滤周序与单双周
    if (!weekMatchesCourse(w, c.weeks)) return;
    const day = Number(c.day); // 0..6
    const body = document.getElementById(`dayBody-${day}`);
    if (!body) return;
    const startMin = parseHM(c.start);
    const endMin = parseHM(c.end);
    const el = createEventEl({
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

function renderFocusSessions(weekStart) {
  const weekEnd = addDays(weekStart, 6);
  const weekStartKey = toDateKey(weekStart);
  const weekEndKey = toDateKey(weekEnd);
  
  // 按天分组专注任务，用于重叠检测
  const sessionsByDay = {};
  for (let i = 0; i <= 6; i++) {
    sessionsByDay[i] = [];
  }
  
  focusSessions.forEach(s => {
    const start = new Date(s.start);
    const end = new Date(s.end);
    // 仅渲染发生在本周内的
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const inRange = d >= weekStart && d <= weekEnd;
    if (!inRange) return;
    const day = d.getDay();
    const startMin = start.getHours()*60 + start.getMinutes();
    const endMin = end.getHours()*60 + end.getMinutes();
    
    sessionsByDay[day].push({
      session: s,
      startMin,
      endMin,
      start,
      end
    });
  });
  
  // 为每天的任务检测重叠并布局
  Object.keys(sessionsByDay).forEach(day => {
    const sessions = sessionsByDay[day];
    if (sessions.length === 0) return;
    
    const body = document.getElementById(`dayBody-${day}`);
    
    // 检测重叠并分配列
    const columns = [];
    sessions.forEach(sessionData => {
      let columnIndex = 0;
      // 找到第一个不重叠的列
      while (columnIndex < columns.length) {
        const hasOverlap = columns[columnIndex].some(existing => 
          !(sessionData.endMin <= existing.startMin || sessionData.startMin >= existing.endMin)
        );
        if (!hasOverlap) break;
        columnIndex++;
      }
      
      // 如果需要新列
      if (columnIndex >= columns.length) {
        columns.push([]);
      }
      columns[columnIndex].push(sessionData);
    });
    
    // 渲染每列的任务
    columns.forEach((column, colIndex) => {
      column.forEach(sessionData => {
        const { session: s, startMin, endMin, start, end } = sessionData;
        const el = createEventEl({
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
        
        // 调整宽度和位置以避免重叠
        const totalColumns = columns.length;
        if (totalColumns > 1) {
          const width = Math.floor(95 / totalColumns); // 95%宽度平分
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

function renderTodayHighlight(weekStart) {
  const now = new Date();
  const start = getWeekStart(now);
  if (start.getTime() !== weekStart.getTime()) return;
  const day = now.getDay();
  const col = dayCols.find(c => c.getAttribute('data-day') === String(day));
  if (col) col.classList.add('today');
}

function renderCalendar() {
  const weekStart = getWeekStart(viewDate);
  clearDayBodies();
  renderWeekHeader(weekStart);
  renderCourses(weekStart);
  renderFocusSessions(weekStart);
  renderTodayHighlight(weekStart);
  renderNowLine(weekStart);
}

// ========== 课程弹窗 ========== 
function openModal(el) { el.setAttribute('aria-hidden', 'false'); }
function closeModal(el) { el.setAttribute('aria-hidden', 'true'); }

addCourseBtn?.addEventListener('click', () => {
  courseTitleInput.value = '';
  courseDaySelect.value = '1';
  courseStartInput.value = '08:00';
  courseEndInput.value = '09:40';
  courseLocationInput.value = '';
  openModal(courseModal);
});



Array.from(document.querySelectorAll('.close-modal')).forEach(btn => {
  btn.addEventListener('click', (e) => {
    const id = btn.getAttribute('data-close');
    if (id && document.getElementById(id)) closeModal(document.getElementById(id));
    if (btn === exitTimerBtn) {
      stopTimer(true); // 退出计时器
    }
  });
});

courseModal?.addEventListener('click', (e) => { if (e.target === courseModal) closeModal(courseModal); });


enumCheck:
saveCourseBtn?.addEventListener('click', () => {
  const title = courseTitleInput.value.trim();
  const day = courseDaySelect.value;
  const start = courseStartInput.value;
  const end = courseEndInput.value;
  const location = courseLocationInput.value.trim();
  if (!title || !start || !end) return;
  if (parseHM(end) <= parseHM(start)) return;
  courses.push({ title, day, start, end, location });
  saveCourses();
  closeModal(courseModal);
  renderCalendar();
});

// ========== 待办渲染 ==========
function renderTasks() {
  taskList.innerHTML = '';
  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''} ${task.isLegacy ? 'legacy' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => toggleTask(index));

    const taskText = document.createElement('span');
    taskText.className = 'task-text';
    // 为遗留任务添加标注
    taskText.textContent = task.isLegacy ? `[遗留] ${task.text}` : task.text;

    const focusBtn = document.createElement('button');
    focusBtn.className = 'focus-btn';
    focusBtn.textContent = '开始专注';
    focusBtn.addEventListener('click', () => openTimerForTask(index));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '删除';
    deleteBtn.addEventListener('click', () => deleteTask(index));

    li.appendChild(checkbox);
    li.appendChild(taskText);
    li.appendChild(focusBtn);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
  });

  saveTasks();
}

function addTask() {
  const text = taskInput.value.trim();
  if (text) {
    tasks.push({ text, completed: false, createdAt: Date.now(), isLegacy: false });
    taskInput.value = '';
    renderTasks();
  }
}

function deleteTask(index) {
  tasks.splice(index, 1);
  renderTasks();
}

function toggleTask(index) {
  tasks[index].completed = !tasks[index].completed;
  renderTasks();
}

addTaskBtn?.addEventListener('click', addTask);
taskInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });

// ========== 周导航 ==========
prevWeekBtn?.addEventListener('click', () => { viewDate = addDays(getWeekStart(viewDate), -7); renderCalendar(); });
nextWeekBtn?.addEventListener('click', () => { viewDate = addDays(getWeekStart(viewDate), 7); renderCalendar(); });
goTodayBtn?.addEventListener('click', () => { viewDate = new Date(); renderCalendar(); });

// ========== 计时器逻辑 ==========
let timerMode = 'countdown';
let timerState = 'idle';
let timerInterval = null;
let startTimestamp = 0;
let pausedAccumMs = 0;
let pausedAt = 0;
let countdownTargetMs = 60 * 60 * 1000; // 默认60分钟
let currentFocusTaskIndex = null;

function setTimerMode(mode) {
  timerMode = mode;
  if (mode === 'countdown') {
    countdownSetup.style.display = 'block';
  } else {
    countdownSetup.style.display = 'none';
  }
}

timerModeInputs.forEach(r => r.addEventListener('change', (e) => {
  const v = e.target.value;
  setTimerMode(v);
}));

function openTimerForTask(index) {
  currentFocusTaskIndex = index;
  timerTaskTitleEl.textContent = tasks[index]?.text || '专注';
  openTimerOverlay();
}

function openTimerOverlay() {
  runningTimeEl.textContent = '00:00:00';
  setupMinutesEl.textContent = Math.round(countdownTargetMs / 60000);
  resetControlsToIdle();
  setTimerMode(document.querySelector('input[name="timerMode"]:checked')?.value || 'countdown');
  timerOverlay.setAttribute('aria-hidden', 'false');
}

function closeTimerOverlay() {
  timerOverlay.setAttribute('aria-hidden', 'true');
}

function resetControlsToIdle() {
  timerState = 'idle';
  clearInterval(timerInterval);
  timerInterval = null;
  startTimestamp = 0;
  pausedAccumMs = 0;
  pausedAt = 0;
  runningTimeEl.textContent = '00:00:00';
  startTimerBtn.disabled = false;
  pauseTimerBtn.disabled = true;
  resetTimerBtn.disabled = true;
  finishTimerBtn.disabled = true;
}

function formatHMS(ms) {
  const total = Math.max(0, Math.floor(ms/1000));
  const h = Math.floor(total/3600);
  const m = Math.floor((total%3600)/60);
  const s = total%60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function updateRunningDisplay() {
  if (timerState !== 'running') return;
  const now = Date.now();
  const elapsed = now - startTimestamp - pausedAccumMs;
  if (timerMode === 'stopwatch') {
    runningTimeEl.textContent = formatHMS(elapsed);
  } else {
    const remain = countdownTargetMs - elapsed;
    runningTimeEl.textContent = formatHMS(remain);
    if (remain <= 0) {
      // 自动完成
      finishTimer();
    }
  }
}

function startTimer() {
  if (timerState === 'running') return;
  if (timerState === 'idle') {
    startTimestamp = Date.now();
    pausedAccumMs = 0;
  }
  timerState = 'running';
  startTimerBtn.disabled = true;
  pauseTimerBtn.disabled = false;
  resetTimerBtn.disabled = false;
  finishTimerBtn.disabled = false;
  timerInterval = setInterval(updateRunningDisplay, 250);
}

function pauseTimer() {
  if (timerState !== 'running') return;
  timerState = 'paused';
  pausedAt = Date.now();
  clearInterval(timerInterval);
  timerInterval = null;
  pauseTimerBtn.textContent = '继续';
}

function resumeTimer() {
  if (timerState !== 'paused') return;
  timerState = 'running';
  pausedAccumMs += Date.now() - pausedAt;
  pausedAt = 0;
  pauseTimerBtn.textContent = '暂停';
  timerInterval = setInterval(updateRunningDisplay, 250);
}

function resetTimer() {
  resetControlsToIdle();
}

function finishTimer() {
  // 记录为完成
  recordFocusSession(true);
  resetControlsToIdle();
  closeTimerOverlay();
  renderCalendar();
}

function stopTimer(exitOnly = false) {
  if (timerState === 'running' || timerState === 'paused') {
    // 记录为中止
    recordFocusSession(false);
  }
  resetControlsToIdle();
  if (exitOnly) closeTimerOverlay();
  else closeTimerOverlay();
  renderCalendar();
}

function recordFocusSession(completed) {
  if (!startTimestamp) return; // 未真正开始
  const now = Date.now();
  const elapsed = (timerState === 'paused' ? pausedAt : now) - startTimestamp - pausedAccumMs;
  let endMs;
  if (timerMode === 'countdown') {
    const targetEnd = startTimestamp + pausedAccumMs + countdownTargetMs;
    endMs = Math.min(now, targetEnd);
  } else {
    endMs = now;
  }
  const startDate = new Date(startTimestamp);
  const endDate = new Date(endMs);
  focusSessions.push({
    title: timerTaskTitleEl.textContent || '专注',
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    mode: timerMode,
    completed
  });
  saveFocusSessions();
  if (completed && currentFocusTaskIndex != null && tasks[currentFocusTaskIndex]) {
    tasks[currentFocusTaskIndex].completed = true;
    saveTasks();
    renderTasks();
  }
  currentFocusTaskIndex = null;
}

startTimerBtn?.addEventListener('click', startTimer);
pauseTimerBtn?.addEventListener('click', () => {
  if (timerState === 'running') pauseTimer(); else if (timerState === 'paused') resumeTimer();
});
resetTimerBtn?.addEventListener('click', resetTimer);
finishTimerBtn?.addEventListener('click', finishTimer);
stopTimerBtn?.addEventListener('click', () => stopTimer(true));

// 倒计时分钟调节（滚轮/键盘）
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function applySetupMinutes(mins) {
  mins = clamp(Math.round(mins), 1, 600);
  setupMinutesEl.textContent = String(mins);
  countdownTargetMs = mins * 60 * 1000;
}

let setupMins = 60;
applySetupMinutes(setupMins);

countdownSetup?.addEventListener('wheel', (e) => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? -5 : 5;
  setupMins = clamp(parseInt(setupMinutesEl.textContent || '60') + delta, 1, 600);
  applySetupMinutes(setupMins);
}, { passive: false });

setupMinutesEl?.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp') { applySetupMinutes(parseInt(setupMinutesEl.textContent||'60') + 1); }
  if (e.key === 'ArrowDown') { applySetupMinutes(parseInt(setupMinutesEl.textContent||'60') - 1); }
});

// ========== 初始化 ==========
renderTimeCol();
renderTasks();

// 迁移清理：删除旧课表(V1)残留与重复项（仅运行一次即可，多次运行也安全）
(function cleanupV1AndDuplicates(){
  try {
    if (!Array.isArray(courses)) courses = [];
    const before = courses.length;
    const TITLES = new Set([
      '面向对象分析和设计',
      '软件测试和验证',
      '计算机逻辑基础',
      '数据挖掘',
      '函数语言程序设计',
      '面向对象分析和设计实践（双周）',
      '算法设计与分析',
      '软件分析与验证前沿',
      '体育与健康—羽毛球（中）',
      '经济学入门'
    ]);
    // 供强一致化的数据（V2 标准）
    const CANON = {
      '面向对象分析和设计': { day:2, start:'08:00', end:'09:35', location:'普陀校区 教书院226 陈小红', weeks:{start:1,end:17,parity:'all'} },
      '软件测试和验证': { day:1, start:'09:50', end:'11:25', location:'普陀校区 理科大楼B226 孙海英', weeks:{start:1,end:17,parity:'all'} },
      '计算机逻辑基础': { day:3, start:'09:50', end:'11:25', location:'普陀校区 教书院223 李钦', weeks:{start:1,end:17,parity:'all'} },
      '数据挖掘': { day:4, start:'09:50', end:'11:25', location:'普陀校区 教书院423 王丽苹', weeks:{start:1,end:17,parity:'all'} },
      '函数语言程序设计': { day:1, start:'13:00', end:'14:35', location:'普陀校区 教书院230 王培新', weeks:{start:1,end:17,parity:'all'} },
      '面向对象分析和设计实践（双周）': { day:2, start:'13:00', end:'14:35', location:'普陀校区 理科大楼B226 陈小红', weeks:{start:2,end:16,parity:'even'} },
      '算法设计与分析': { day:2, start:'14:50', end:'16:25', location:'普陀校区 教书院128 彭超', weeks:{start:1,end:17,parity:'all'} },
      '软件分析与验证前沿': { day:4, start:'14:50', end:'16:25', location:'普陀校区 教书院419 苏亭', weeks:{start:1,end:17,parity:'all'} },
      '体育与健康—羽毛球（中）': { day:5, start:'14:50', end:'16:25', location:'普陀校区 中北学生活动中心多功能厅 丁洪祥', weeks:{start:1,end:16,parity:'all'} },
      '经济学入门': { day:3, start:'18:00', end:'20:25', location:'普陀校区 教书院113 李莉', weeks:{start:7,end:17,parity:'all'} }
    };

    // 1) 移除无 weeks 字段的同名旧课程（V1导入的特征）
    courses = courses.filter(c => !(TITLES.has(c.title) && !c.weeks));

    // 2) 将已知标题强制规范化为 V2 标准：仅保留与 CANON 完全匹配的项
    courses = courses.filter(c => {
      if (!TITLES.has(c.title)) return true;
      const canon = CANON[c.title];
      if (!canon) return true;
      const same = Number(c.day) === canon.day && c.start === canon.start && c.end === canon.end;
      return same; // 对这些标题，只保留标准定义
    });

    // 3) 确保所有 CANON 课程都存在，不存在则补齐
    const byKey = new Set(courses.map(c => `${c.title}|${c.day}|${c.start}|${c.end}`));
    Object.entries(CANON).forEach(([title, canon]) => {
      const k = `${title}|${canon.day}|${canon.start}|${canon.end}`;
      if (!byKey.has(k)) {
        courses.push({ title, ...canon });
        byKey.add(k);
      }
    });

    // 4) 去重（再次）：相同 title|day|start|end 优先保留带 weeks 的
    const key = c => `${c.title}|${c.day}|${c.start}|${c.end}`;
    const map = new Map();
    for (const c of courses) {
      const k = key(c);
      if (!map.has(k)) { map.set(k, c); continue; }
      const prev = map.get(k);
      if (!prev.weeks && c.weeks) map.set(k, c);
    }
    courses = Array.from(map.values());

    const after = courses.length;
    if (after !== before) saveCourses();
    // 清除V1导入标记
    if (localStorage.getItem('coursesImportedFromUserSchedule') === '1') {
      localStorage.removeItem('coursesImportedFromUserSchedule');
    }
  } catch (e) { console.warn('cleanupV1AndDuplicates failed:', e); }
})();
// // 自动导入用户提供的课表（仅首次）
// (function autoImportUserScheduleOnce(){
//   try {
//     if (DISABLE_V1_IMPORT) return; // 已禁用V1导入
//     const imported = localStorage.getItem('coursesImportedFromUserSchedule') === '1';
//     if (imported) return;
//     const USER_SCHEDULE = [
//       { title:'面向对象分析和设计', day:1, start:'08:00', end:'09:35', location:'普陀校区 教书院226 陈小红 (1~17周 1-2节)' },
//       { title:'软件测试和验证', day:2, start:'09:50', end:'11:25', location:'普陀校区 理科大楼B226 孙海英 (1~17周 3-4节)' },
//       { title:'计算机逻辑基础', day:3, start:'09:50', end:'11:25', location:'普陀校区 教书院223 李钦 (1~17周 3-4节)' },
//       { title:'数据挖掘', day:4, start:'09:50', end:'11:25', location:'普陀校区 教书院423 王丽苹 (1~17周 3-4节)' },
//       { title:'函数语言程序设计', day:1, start:'13:00', end:'14:35', location:'普陀校区 教书院230 王培新 (1~17周 6-7节)' },
//       { title:'面向对象分析和设计实践（双周）', day:2, start:'13:00', end:'14:35', location:'普陀校区 理科大楼B226 陈小红 (2~16(双)周 6-7节)' },
//       { title:'算法设计与分析', day:1, start:'14:50', end:'16:25', location:'普陀校区 教书院128 彭超 (1~17周 8-9节)' },
//       { title:'软件分析与验证前沿', day:4, start:'14:50', end:'16:25', location:'普陀校区 教书院419 苏亭 (1~17周 8-9节)' },
//       { title:'体育与健康—羽毛球（中）', day:3, start:'14:50', end:'16:25', location:'普陀校区 中北学生活动中心多功能厅 丁洪祥 (1~16周 8-9节)' },
//       { title:'经济学入门', day:2, start:'18:00', end:'20:25', location:'普陀校区 教书院113 李莉 (7~17周 11-13节)' }
//     ];
//     // 仅在当前没有课程时导入，避免覆盖用户已有数据
//     if (!Array.isArray(courses) || courses.length === 0) {
//       courses = USER_SCHEDULE.slice();
//     } else {
//       // 合并但避免重复（按title+day+start判断）
//       const key = c => `${c.title}|${c.day}|${c.start}|${c.end}`;
//       const existing = new Set(courses.map(key));
//       USER_SCHEDULE.forEach(c => { if (!existing.has(key(c))) courses.push(c); });
//     }
//     saveCourses();
//     localStorage.setItem('coursesImportedFromUserSchedule','1');
//   } catch (e) {
//     console.error('Auto import schedule failed:', e);
//   }
// })();

renderCalendar();
// 同步修正用户课表（V2，含周序/单双周）
(function syncUserScheduleV2(){
  try {
    const version = localStorage.getItem('coursesImportedVersion');
    if (version === '2') return;
    const TITLES = new Set([
      '面向对象分析和设计',
      '软件测试和验证',
      '计算机逻辑基础',
      '数据挖掘',
      '函数语言程序设计',
      '面向对象分析和设计实践（双周）',
      '算法设计与分析',
      '软件分析与验证前沿',
      '体育与健康—羽毛球（中）',
      '经济学入门'
    ]);
    const NEW_SCHEDULE = [
      { title:'面向对象分析和设计', day:2, start:'08:00', end:'09:35', location:'普陀校区 教书院226 陈小红', weeks:{start:1,end:17,parity:'all'} },
      { title:'软件测试和验证', day:1, start:'09:50', end:'11:25', location:'普陀校区 理科大楼B226 孙海英', weeks:{start:1,end:17,parity:'all'} },
      { title:'计算机逻辑基础', day:3, start:'09:50', end:'11:25', location:'普陀校区 教书院223 李钦', weeks:{start:1,end:17,parity:'all'} },
      { title:'数据挖掘', day:4, start:'09:50', end:'11:25', location:'普陀校区 教书院423 王丽苹', weeks:{start:1,end:17,parity:'all'} },
      { title:'函数语言程序设计', day:1, start:'13:00', end:'14:35', location:'普陀校区 教书院230 王培新', weeks:{start:1,end:17,parity:'all'} },
      { title:'面向对象分析和设计实践（双周）', day:2, start:'13:00', end:'14:35', location:'普陀校区 理科大楼B226 陈小红', weeks:{start:2,end:16,parity:'even'} },
      { title:'算法设计与分析', day:2, start:'14:50', end:'16:25', location:'普陀校区 教书院128 彭超', weeks:{start:1,end:17,parity:'all'} },
      { title:'软件分析与验证前沿', day:4, start:'14:50', end:'16:25', location:'普陀校区 教书院419 苏亭', weeks:{start:1,end:17,parity:'all'} },
      { title:'体育与健康—羽毛球（中）', day:5, start:'14:50', end:'16:25', location:'普陀校区 中北学生活动中心多功能厅 丁洪祥', weeks:{start:1,end:16,parity:'all'} },
      { title:'经济学入门', day:3, start:'18:00', end:'20:25', location:'普陀校区 教书院113 李莉', weeks:{start:7,end:17,parity:'all'} }
    ];

    // 删除旧的同名课程，再合并新课表
    if (!Array.isArray(courses)) courses = [];
    courses = courses.filter(c => !TITLES.has(c.title));
    courses = courses.concat(NEW_SCHEDULE);
    saveCourses();
    localStorage.setItem('coursesImportedVersion','2');
  } catch(e) {
    console.error('syncUserScheduleV2 failed:', e);
  }
})();
renderCalendar();
// 事件详情弹窗
const eventDetailModal = document.getElementById('eventDetailModal');
const detailTitle = document.getElementById('detailTitle');
const detailTime = document.getElementById('detailTime');
const detailLocation = document.getElementById('detailLocation');
const detailWeeks = document.getElementById('detailWeeks');

function weeksToText(weeks){
  if (!weeks) return '全学期';
  const p = weeks.parity === 'odd' ? '（单周）' : weeks.parity === 'even' ? '（双周）' : '';
  return `第${weeks.start}-${weeks.end}周${p}`;
}

function openEventDetail(detail){
  detailTitle.textContent = detail.title || '';
  detailTime.textContent = detail.time || '';
  detailLocation.textContent = detail.location || '';
  detailWeeks.textContent = weeksToText(detail.weeks);
  openModal(eventDetailModal);
}

// 点击遮罩关闭
eventDetailModal?.addEventListener('click', (e) => { if (e.target === eventDetailModal) closeModal(eventDetailModal); });

// ========== 每日任务自动清理功能 ==========
function cleanupCompletedTasks() {
  const completedTasks = tasks.filter(task => task.completed);
  const incompleteTasks = tasks.filter(task => !task.completed);
  
  // 将未完成的任务标记为遗留
  incompleteTasks.forEach(task => {
    if (!task.isLegacy) {
      task.isLegacy = true;
    }
  });
  
  // 只保留未完成的任务
  tasks = incompleteTasks;
  saveTasks();
  renderTasks();
  
  console.log(`每日清理完成：删除了 ${completedTasks.length} 个已完成任务，${incompleteTasks.length} 个未完成任务标记为遗留`);
}

function scheduleNextCleanup() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0); // 设置为明天的00:00:00
  
  const msUntilMidnight = tomorrow.getTime() - now.getTime();
  
  setTimeout(() => {
    cleanupCompletedTasks();
    // 清理完成后，安排下一次清理
    scheduleNextCleanup();
  }, msUntilMidnight);
  
  console.log(`下次任务清理时间：${tomorrow.toLocaleString()}`);
}

// 检查是否需要立即执行清理（页面加载时检查）
function checkInitialCleanup() {
  const lastCleanupDate = localStorage.getItem('lastTaskCleanup');
  const today = new Date().toDateString();
  
  if (lastCleanupDate !== today) {
    // 如果今天还没有清理过，执行清理
    cleanupCompletedTasks();
    localStorage.setItem('lastTaskCleanup', today);
  }
}

// 页面加载时执行初始检查和安排定时清理
checkInitialCleanup();
scheduleNextCleanup();

// 监听窗口大小变化，重新渲染日历以确保时间对齐
window.addEventListener('resize', () => {
  renderCalendar();
});