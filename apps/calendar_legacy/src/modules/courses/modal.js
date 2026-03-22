/**
 * 课程添加弹窗逻辑。
 * 绑定添加课程按钮与保存课程行为。
 */

import { openModal, closeModal } from '../modals/modals.js';
import { parseHM } from '../utils/time.js';
import { courses, saveCourses } from '../storage/index.js';
import { renderCalendar, getViewDate } from '../calendar/calendar.js';

export function bindCourseModal(dom) {
  dom.addCourseBtn?.addEventListener('click', () => {
    dom.courseTitleInput.value = '';
    dom.courseDaySelect.value = '1';
    dom.courseStartInput.value = '08:00';
    dom.courseEndInput.value = '09:40';
    dom.courseLocationInput.value = '';
    openModal(dom.courseModal);
  });

  // 移除旧的蒙层全局绑定，改由 openModal 按需绑定并在 close 时释放

  dom.saveCourseBtn?.addEventListener('click', () => {
    const title = dom.courseTitleInput.value.trim();
    const day = dom.courseDaySelect.value;
    const start = dom.courseStartInput.value;
    const end = dom.courseEndInput.value;
    const location = dom.courseLocationInput.value.trim();
    if (!title || !start || !end) return;
    if (parseHM(end) <= parseHM(start)) return;
    courses.push({ title, day, start, end, location });
    saveCourses();
    closeModal(dom.courseModal);
    renderCalendar(dom);
  });
}