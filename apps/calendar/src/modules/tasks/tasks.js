/**
 * 待办任务模块。
 * 渲染任务列表及添加/删除/切换完成，并包含每日自动清理逻辑。
 */

import { tasks, saveTasks, setTasks } from '../storage/index.js';
import { openTimerForTask } from '../timer/timer.js';

export function renderTasks(dom) {
  dom.taskList.innerHTML = '';
  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''} ${task.isLegacy ? 'legacy' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => toggleTask(dom, index));

    const taskText = document.createElement('span');
    taskText.className = 'task-text';
    taskText.textContent = task.isLegacy ? `[遗留] ${task.text}` : task.text;

    const focusBtn = document.createElement('button');
    focusBtn.className = 'focus-btn';
    focusBtn.textContent = '开始专注';
    focusBtn.addEventListener('click', () => openTimerForTask(dom, index));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '删除';
    deleteBtn.addEventListener('click', () => deleteTask(dom, index));

    li.appendChild(checkbox);
    li.appendChild(taskText);
    li.appendChild(focusBtn);
    li.appendChild(deleteBtn);
    dom.taskList.appendChild(li);
  });
  saveTasks();
}

export function addTask(dom) {
  const text = dom.taskInput.value.trim();
  if (text) {
    tasks.push({ text, completed: false, createdAt: Date.now(), isLegacy: false });
    dom.taskInput.value = '';
    renderTasks(dom);
  }
}

export function deleteTask(dom, index) {
  tasks.splice(index, 1);
  renderTasks(dom);
}

export function toggleTask(dom, index) {
  tasks[index].completed = !tasks[index].completed;
  renderTasks(dom);
}

export function bindTaskInputs(dom) {
  dom.addTaskBtn?.addEventListener('click', () => addTask(dom));
  dom.taskInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(dom); });
}

// ===== 每日任务自动清理 =====
export function cleanupCompletedTasks(dom) {
  const completedTasks = tasks.filter(task => task.completed);
  const incompleteTasks = tasks.filter(task => !task.completed);
  incompleteTasks.forEach(task => { if (!task.isLegacy) task.isLegacy = true; });
  setTasks(incompleteTasks);
  renderTasks(dom);
  console.log(`每日清理完成：删除了 ${completedTasks.length} 个已完成任务，${incompleteTasks.length} 个未完成任务标记为遗留`);
}

export function scheduleNextCleanup(dom) {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const msUntilMidnight = tomorrow.getTime() - now.getTime();
  setTimeout(() => { cleanupCompletedTasks(dom); scheduleNextCleanup(dom); }, msUntilMidnight);
  console.log(`下次任务清理时间：${tomorrow.toLocaleString()}`);
}

export function checkInitialCleanup(dom) {
  const lastCleanupDate = localStorage.getItem('lastTaskCleanup');
  const today = new Date().toDateString();
  if (lastCleanupDate !== today) {
    cleanupCompletedTasks(dom);
    localStorage.setItem('lastTaskCleanup', today);
  }
}