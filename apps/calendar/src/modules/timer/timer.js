/**
 * 计时器模块。
 * 提供倒计时/正计时两种模式，记录专注会话并与待办联动。
 */

import { clamp, formatHMS } from '../utils/time.js';
import { tasks, focusSessions, saveTasks, saveFocusSessions } from '../storage/index.js';
import { renderTasks } from '../tasks/tasks.js';
import { renderCalendar } from '../calendar/calendar.js';

let timerMode = 'countdown';
let timerState = 'idle';
let timerInterval = null;
let startTimestamp = 0;
let pausedAccumMs = 0;
let pausedAt = 0;
let countdownTargetMs = 60 * 60 * 1000; // 默认60分钟
let currentFocusTaskIndex = null;

function setTimerMode(dom, mode) {
  timerMode = mode;
  if (mode === 'countdown') dom.countdownSetup.style.display = 'block';
  else dom.countdownSetup.style.display = 'none';
}

export function openTimerForTask(dom, index) {
  currentFocusTaskIndex = index;
  dom.timerTaskTitleEl.textContent = tasks[index]?.text || '专注';
  openTimerOverlay(dom);
}

function openTimerOverlay(dom) {
  dom.runningTimeEl.textContent = '00:00:00';
  dom.setupMinutesEl.textContent = Math.round(countdownTargetMs / 60000);
  resetControlsToIdle(dom);
  const checked = document.querySelector('input[name="timerMode"]:checked')?.value || 'countdown';
  setTimerMode(dom, checked);
  dom.timerOverlay.setAttribute('aria-hidden', 'false');
}

function closeTimerOverlay(dom) {
  dom.timerOverlay.setAttribute('aria-hidden', 'true');
}

function resetControlsToIdle(dom) {
  timerState = 'idle';
  clearInterval(timerInterval); timerInterval = null;
  startTimestamp = 0; pausedAccumMs = 0; pausedAt = 0;
  dom.runningTimeEl.textContent = '00:00:00';
  dom.startTimerBtn.disabled = false;
  dom.pauseTimerBtn.disabled = true;
  dom.resetTimerBtn.disabled = true;
  dom.finishTimerBtn.disabled = true;
  dom.pauseTimerBtn.textContent = '暂停';
}

function updateRunningDisplay(dom) {
  if (timerState !== 'running') return;
  const now = Date.now();
  const elapsed = now - startTimestamp - pausedAccumMs;
  if (timerMode === 'stopwatch') {
    dom.runningTimeEl.textContent = formatHMS(elapsed);
  } else {
    const remain = countdownTargetMs - elapsed;
    dom.runningTimeEl.textContent = formatHMS(remain);
    if (remain <= 0) finishTimer(dom);
  }
}

function startTimer(dom) {
  if (timerState === 'running') return;
  if (timerState === 'idle') { startTimestamp = Date.now(); pausedAccumMs = 0; }
  timerState = 'running';
  dom.startTimerBtn.disabled = true;
  dom.pauseTimerBtn.disabled = false;
  dom.resetTimerBtn.disabled = false;
  dom.finishTimerBtn.disabled = false;
  timerInterval = setInterval(() => updateRunningDisplay(dom), 250);
}

function pauseTimer(dom) {
  if (timerState !== 'running') return;
  timerState = 'paused'; pausedAt = Date.now();
  clearInterval(timerInterval); timerInterval = null;
  dom.pauseTimerBtn.textContent = '继续';
}

function resumeTimer(dom) {
  if (timerState !== 'paused') return;
  timerState = 'running';
  pausedAccumMs += Date.now() - pausedAt; pausedAt = 0;
  dom.pauseTimerBtn.textContent = '暂停';
  timerInterval = setInterval(() => updateRunningDisplay(dom), 250);
}

function resetTimer(dom) { resetControlsToIdle(dom); }

function finishTimer(dom) {
  // 若未真正启动计时，仍允许直接完成任务（不记录会话）
  if (!startTimestamp) {
    if (currentFocusTaskIndex != null && tasks[currentFocusTaskIndex]) {
      tasks[currentFocusTaskIndex].completed = true;
      saveTasks();
      renderTasks(dom);
      currentFocusTaskIndex = null;
    }
    resetControlsToIdle(dom);
    closeTimerOverlay(dom);
    renderCalendar(dom);
    return;
  }
  recordFocusSession(dom, true);
  resetControlsToIdle(dom);
  closeTimerOverlay(dom);
  renderCalendar(dom);
}

function stopTimer(dom, exitOnly = false) {
  if (timerState === 'running' || timerState === 'paused') recordFocusSession(dom, false);
  resetControlsToIdle(dom);
  closeTimerOverlay(dom);
  renderCalendar(dom);
}

function recordFocusSession(dom, completed) {
  if (!startTimestamp) return;
  const now = Date.now();
  const elapsed = (timerState === 'paused' ? pausedAt : now) - startTimestamp - pausedAccumMs;
  let endMs;
  if (timerMode === 'countdown') {
    const targetEnd = startTimestamp + pausedAccumMs + countdownTargetMs;
    endMs = Math.min(now, targetEnd);
  } else { endMs = now; }
  const startDate = new Date(startTimestamp);
  const endDate = new Date(endMs);
  focusSessions.push({
    title: dom.timerTaskTitleEl.textContent || '专注',
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    mode: timerMode,
    completed
  });
  saveFocusSessions();
  if (completed && currentFocusTaskIndex != null && tasks[currentFocusTaskIndex]) {
    tasks[currentFocusTaskIndex].completed = true;
    saveTasks();
    renderTasks(dom);
  }
  currentFocusTaskIndex = null;
}

function applySetupMinutes(dom, mins) {
  mins = clamp(Math.round(mins), 1, 600);
  dom.setupMinutesEl.textContent = String(mins);
  countdownTargetMs = mins * 60 * 1000;
}

export function initTimer(dom) {
  // 模式切换
  dom.timerModeInputs.forEach(r => r.addEventListener('change', (e) => {
    const v = e.target.value; setTimerMode(dom, v);
  }));
  // 控件绑定
  dom.startTimerBtn?.addEventListener('click', () => startTimer(dom));
  dom.pauseTimerBtn?.addEventListener('click', () => {
    if (timerState === 'running') pauseTimer(dom); else if (timerState === 'paused') resumeTimer(dom);
  });
  dom.resetTimerBtn?.addEventListener('click', () => resetTimer(dom));
  dom.finishTimerBtn?.addEventListener('click', () => finishTimer(dom));
  dom.stopTimerBtn?.addEventListener('click', () => stopTimer(dom, true));
  // 倒计时分钟调节
  let setupMins = 60; applySetupMinutes(dom, setupMins);
  dom.countdownSetup?.addEventListener('wheel', (e) => {
    e.preventDefault(); const delta = e.deltaY > 0 ? -5 : 5;
    setupMins = clamp(parseInt(dom.setupMinutesEl.textContent || '60') + delta, 1, 600);
    applySetupMinutes(dom, setupMins);
  }, { passive: false });
  dom.setupMinutesEl?.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') { applySetupMinutes(dom, parseInt(dom.setupMinutesEl.textContent||'60') + 1); }
    if (e.key === 'ArrowDown') { applySetupMinutes(dom, parseInt(dom.setupMinutesEl.textContent||'60') - 1); }
  });
}

export function stopTimerFromExit(dom) { stopTimer(dom, true); }