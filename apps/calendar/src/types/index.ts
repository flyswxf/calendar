/**
 * 类型定义汇总
 * 全项目共享的数据模型接口
 */

/** 待办事项 */
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  isLegacy?: boolean; // 标记从旧版迁移过来的任务
}

/** 课程 */
export interface Course {
  id: string;
  title: string;
  day: number; // 0=周日 1=周一 6=周六 7=周日
  start: string; // 如 "08:00"
  end: string; // 如 "09:40"
  location: string;
  teacher?: string;
  weeks?: number[]; // 可选：周次信息
}

/** 专注会话 */
export interface FocusSession {
  id: string;
  title: string;
  start: string; // ISO
  end: string; // ISO
  mode: 'countdown' | 'stopwatch';
  completed: boolean;
}

/** 截止事件数据来源 */
export type DeadlineSource = 'manual' | 'photo_ocr' | 'chaoxing_text';

/** 截止事件 */
export interface DeadlineEvent {
  id: string;
  title: string;
  dueAt: string; // ISO
  courseName?: string;
  description?: string;
  source: DeadlineSource;
  confidence: number; // 0-1
  createdAt: number;
  completed?: boolean;
}

/** 行动记录数据来源 */
export type DailyActionSource = 'manual' | 'auto_calendar' | 'timer' | 'fuzzy';

/** 行动记录置信度 */
export type DailyActionConfidence = 'exact' | 'adjusted' | 'fuzzy';

/** 行动记录事件 */
export interface DailyActionEvent {
  id: string;
  name: string;
  source: DailyActionSource;
  confidence: DailyActionConfidence;
  startAt: string; // ISO
  endAt: string | null;
  durationMin: number;
  dateKey: string; // "YYYY-MM-DD"
  createdAt: number;
  updatedAt: number;
  autoCourseKey?: string; // 课程自动生成的去重 key
}
