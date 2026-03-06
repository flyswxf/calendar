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
  day: number; // 1 (Mon) - 7 (Sun) or 0 (Sun)? In JS code, day 0 is Sunday, but modal uses 1-5. I'll stick to 1-7 or 0-6.
               // JS code: `const day = d.getDay(); // 0 周日`. Modal select options: 1-5.
               // I'll use 0-6 where 0 is Sunday, 1 is Monday.
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  location: string;
}

export interface FocusSession {
  id: string;
  title: string;
  start: string; // ISO Date string
  end: string; // ISO Date string
  mode: 'countdown' | 'stopwatch';
  completed: boolean;
}

export interface AppState {
  tasks: Task[];
  courses: Course[];
  focusSessions: FocusSession[];
  syncUserId: string | null;
}
