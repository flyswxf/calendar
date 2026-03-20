export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  isLegacy?: boolean;
}

export interface Course {
  id: string;
  title: string;
  day: number;
  start: string;
  end: string;
  location: string;
  teacher?: string;
  weeks?: number[]; // 可选：周次信息
}

export interface FocusSession {
  id: string;
  title: string;
  start: string;
  end: string;
  mode: 'countdown' | 'stopwatch';
  completed: boolean;
}

export type DeadlineSource = 'manual' | 'photo_ocr' | 'chaoxing_text';

export interface DeadlineEvent {
  id: string;
  title: string;
  dueAt: string;
  courseName?: string;
  description?: string;
  source: DeadlineSource;
  confidence: number;
  createdAt: number;
  completed?: boolean;
}

export type DailyActionSource = 'manual' | 'auto_calendar' | 'timer' | 'fuzzy';

export type DailyActionConfidence = 'exact' | 'adjusted' | 'fuzzy';

export interface DailyActionEvent {
  id: string;
  name: string;
  source: DailyActionSource;
  confidence: DailyActionConfidence;
  startAt: string;
  endAt: string | null;
  durationMin: number;
  dateKey: string;
  createdAt: number;
  updatedAt: number;
  autoCourseKey?: string;
}
