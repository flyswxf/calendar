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
