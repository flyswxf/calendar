import { initTimer, openTimerForTask } from '../src/modules/timer/timer.js';
import { tasks, setTasks } from '../src/modules/storage/index.js';

const resultsEl = document.getElementById('results');
function logResult(name, ok, detail='') {
  const div = document.createElement('div');
  div.className = ok ? 'pass' : 'fail';
  div.textContent = `${ok ? '✔' : '✘'} ${name} ${detail}`;
  resultsEl.appendChild(div);
}

function makeDom() {
  const el = (tag='div') => document.createElement(tag);
  const dom = {
    timerOverlay: el('div'),
    timerTaskTitleEl: el('span'),
    runningTimeEl: el('span'),
    countdownSetup: el('div'),
    setupMinutesEl: el('span'),
    startTimerBtn: el('button'),
    pauseTimerBtn: el('button'),
    resetTimerBtn: el('button'),
    finishTimerBtn: el('button'),
    stopTimerBtn: el('button'),
    timerModeInputs: [],
  };
  dom.timerOverlay.setAttribute('aria-hidden','true');
  document.body.appendChild(dom.timerOverlay);
  return dom;
}

try {
  const dom = makeDom();
  setTasks([{ text:'测试任务', completed:false }]);
  initTimer(dom);
  openTimerForTask(dom, 0);
  logResult('openTimerForTask sets overlay visible', dom.timerOverlay.getAttribute('aria-hidden') === 'false');
  logResult('openTimerForTask sets task title', dom.timerTaskTitleEl.textContent.includes('测试任务'));
  // 触发开始->完成的流程：直接点击完成按钮
  dom.finishTimerBtn.click();
  logResult('finish marks task completed', tasks[0].completed === true);
} catch (e) {
  logResult('timer tests runtime', false, e.message);
}