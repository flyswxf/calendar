export function queryDOM() {
  // 待办
  const taskInput = document.getElementById('taskInput');
  const addTaskBtn = document.getElementById('addTask');
  const taskList = document.getElementById('taskList');

  // 日历与控制（与 index.html 的 id 对齐）
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

  // 事件详情
  const eventDetailModal = document.getElementById('eventDetailModal');
  const detailTitle = document.getElementById('detailTitle');
  const detailTime = document.getElementById('detailTime');
  const detailLocation = document.getElementById('detailLocation');
  const detailWeeks = document.getElementById('detailWeeks');

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
  const timerModeInputs = Array.from(document.querySelectorAll('input[name="timerMode"]'));

  return {
    // 待办
    taskInput, addTaskBtn, taskList,
    // 日历
    timeCol, calendarWeekLabel, dayBodies, dayCols, dayHeaders,
    prevWeekBtn, nextWeekBtn, goTodayBtn,
    // 课程
    addCourseBtn, courseModal, courseTitleInput, courseDaySelect,
    courseStartInput, courseEndInput, courseLocationInput, saveCourseBtn,
    // 事件详情
    eventDetailModal, detailTitle, detailTime, detailLocation, detailWeeks,
    // 计时器
    timerOverlay, timerTaskTitleEl, exitTimerBtn, startTimerBtn,
    pauseTimerBtn, resetTimerBtn, finishTimerBtn, stopTimerBtn,
    runningTimeEl, setupMinutesEl, countdownSetup, timerModeInputs
  };
}