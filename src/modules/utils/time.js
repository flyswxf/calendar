/**
 * 时间与格式化工具函数集合。
 * 提供日期/时间计算、显示格式化以及布局相关常量。
 * 供日历渲染、计时器、课程模块等使用。
 */

// 布局时间范围（分钟）
export const BASE_START_MIN = 7 * 60; // 7:00
export const END_MIN = 23 * 60; // 23:00

// 学期开始日期：第1周从 2025-09-15 开始（周一）
export const SEMESTER_START = new Date(2025, 8, 15);

/**
 * 计算每分钟对应的像素，用于时间块的垂直定位。
 * 会根据屏幕尺寸适配。
 */
export function getPixelPerMin() {
  if (window.innerWidth <= 480) {
    return 35 / 60; // 超小屏：35px/小时 ≈ 0.583px/分钟
  } else if (window.innerWidth <= 768) {
    return 40 / 60; // 手机端：40px/小时 ≈ 0.667px/分钟
  }
  return 0.8; // 桌面端：48px/小时 = 0.8px/分钟
}

export function pad(n) { return n < 10 ? '0' + n : '' + n; }
export function fmtTime(h, m) { return `${pad(h)}:${pad(m)}`; }
export function fmtHM(minutesOfDay) { const h = Math.floor(minutesOfDay / 60); const m = minutesOfDay % 60; return fmtTime(h, m); }
export function formatDateLabel(d) { return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())}`; }
export function toDateKey(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }

export function getWeekStart(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 周日
  const diff = (day === 0 ? -6 : 1 - day); // 回到周一
  d.setDate(d.getDate() + diff);
  d.setHours(0,0,0,0);
  return d;
}

export function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }

export function parseHM(str) { const [h,m] = str.split(':').map(Number); return h*60 + m; }

export function getWeekNumber(weekStart) {
  const semStart = getWeekStart(SEMESTER_START);
  const diffDays = Math.floor((weekStart - semStart) / (24*3600*1000));
  const w = Math.floor(diffDays / 7) + 1;
  return w;
}

/**
 * 判断课程在某周是否应该显示（周序范围与单双周）。
 */
export function weekMatchesCourse(weekNo, weeks){
  if (!weeks) return true; // 未设置则默认全周
  if (weekNo < weeks.start || weekNo > weeks.end) return false;
  if (weeks.parity === 'odd') return (weekNo % 2) === 1;
  if (weeks.parity === 'even') return (weekNo % 2) === 0;
  return true;
}

/** 数值钳制 */
export function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

/** 毫秒转 HH:MM:SS */
export function formatHMS(ms) {
  const total = Math.max(0, Math.floor(ms/1000));
  const h = Math.floor(total/3600);
  const m = Math.floor((total%3600)/60);
  const s = total%60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}