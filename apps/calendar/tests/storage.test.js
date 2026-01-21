import { tasks, courses, focusSessions, loadTasks, loadCourses, loadFocusSessions, saveTasks, saveCourses, saveFocusSessions, setTasks, setCourses, setFocusSessions } from '../src/modules/storage/index.js';

const resultsEl = document.getElementById('results');
function logResult(name, ok, detail='') {
  const div = document.createElement('div');
  div.className = ok ? 'pass' : 'fail';
  div.textContent = `${ok ? '✔' : '✘'} ${name} ${detail}`;
  resultsEl.appendChild(div);
}

try {
  setTasks([]); setCourses([]); setFocusSessions([]);
  saveTasks(); saveCourses(); saveFocusSessions();
  loadTasks(); loadCourses(); loadFocusSessions();
  logResult('load empty arrays', Array.isArray(tasks) && tasks.length === 0 && Array.isArray(courses) && courses.length === 0 && Array.isArray(focusSessions) && focusSessions.length === 0);

  tasks.push({ text: 't', completed: false }); saveTasks();
  courses.push({ title:'c', day:'1', start:'08:00', end:'09:00' }); saveCourses();
  focusSessions.push({ title:'s', start: new Date().toISOString(), end: new Date().toISOString(), mode:'stopwatch' }); saveFocusSessions();
  loadTasks(); loadCourses(); loadFocusSessions();
  logResult('persist arrays to localStorage', tasks.length === 1 && courses.length === 1 && focusSessions.length === 1);
} catch (e) {
  logResult('storage tests runtime', false, e.message);
}