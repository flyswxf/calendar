/**
 * 本地存储模块。
 * 负责管理 tasks、courses、focusSessions 三类数据的加载与保存。
 */

export let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
export let courses = JSON.parse(localStorage.getItem('courses')) || [];
export let focusSessions = JSON.parse(localStorage.getItem('focusSessions')) || [];
export let syncUserId = localStorage.getItem('syncUserId') || null;

export function saveTasks() { localStorage.setItem('tasks', JSON.stringify(tasks)); saveAllToRemote(); }
export function saveCourses() { localStorage.setItem('courses', JSON.stringify(courses)); saveAllToRemote(); }
export function saveFocusSessions() { localStorage.setItem('focusSessions', JSON.stringify(focusSessions)); saveAllToRemote(); }

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
export function setSyncUserId(id){ syncUserId = id; localStorage.setItem('syncUserId', id); }
export async function loadAllFromRemote(){
  if(!syncUserId) return;
  try{
    const res = await fetch(`/api/data?userId=${encodeURIComponent(syncUserId)}`);
    if(res.ok){
      const j = await res.json();
      tasks = Array.isArray(j.tasks) ? j.tasks : [];
      courses = Array.isArray(j.courses) ? j.courses : [];
      focusSessions = Array.isArray(j.focusSessions) ? j.focusSessions : [];
      saveTasks();
      saveCourses();
      saveFocusSessions();
    }
  }catch(e){}
}
export async function saveAllToRemote(){
  if(!syncUserId) return;
  try{
    await fetch(`/api/data?userId=${encodeURIComponent(syncUserId)}`,{
      method:'PUT',
      headers:{'content-type':'application/json'},
      body: JSON.stringify({ tasks, courses, focusSessions })
    });
  }catch(e){}
}