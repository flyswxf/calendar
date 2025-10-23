/**
 * 本地存储模块。
 * 负责管理 tasks、courses、focusSessions 三类数据的加载与保存。
 */

export let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
export let courses = JSON.parse(localStorage.getItem('courses')) || [];
export let focusSessions = JSON.parse(localStorage.getItem('focusSessions')) || [];

export function saveTasks() { localStorage.setItem('tasks', JSON.stringify(tasks)); }
export function saveCourses() { localStorage.setItem('courses', JSON.stringify(courses)); }
export function saveFocusSessions() { localStorage.setItem('focusSessions', JSON.stringify(focusSessions)); }

export function loadTasks(){ tasks = JSON.parse(localStorage.getItem('tasks')) || []; }
export function loadCourses(){ courses = JSON.parse(localStorage.getItem('courses')) || []; }
export function loadFocusSessions(){ focusSessions = JSON.parse(localStorage.getItem('focusSessions')) || []; }

/**
 * 替换 tasks 列表（用于清理等场景）。
 */
export function setTasks(newTasks) { tasks = newTasks; saveTasks(); }

/** 更新单个任务（索引） */
export function updateTask(index, updater) {
  tasks[index] = updater(tasks[index]);
  saveTasks();
}

export function setCourses(newCourses){ courses = newCourses; saveCourses(); }
export function setFocusSessions(newFS){ focusSessions = newFS; saveFocusSessions(); }