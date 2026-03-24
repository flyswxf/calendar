import { createContext } from 'react';
import { Course, DailyActionEvent, DeadlineEvent, FocusSession, Task } from '../types';

export interface StorageContextType {
  tasks: Task[];
  courses: Course[];
  focusSessions: FocusSession[];
  deadlineEvents: DeadlineEvent[];
  dailyActionEvents: DailyActionEvent[];
  semesterStartDate: string | null;
  isSupabaseConfigured: boolean;
  authEmail: string | null;
  authLoading: boolean;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  setFocusSessions: React.Dispatch<React.SetStateAction<FocusSession[]>>;
  setDeadlineEvents: React.Dispatch<React.SetStateAction<DeadlineEvent[]>>;
  setDailyActionEvents: React.Dispatch<React.SetStateAction<DailyActionEvent[]>>;
  setSemesterStartDate: (date: string | null) => void;
  syncUserId: string | null;
  setSyncUserId: (id: string | null) => void;
  sendLoginCode: (email: string) => Promise<{ ok: boolean; message: string }>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
  loading: boolean;
}

export const StorageContext = createContext<StorageContextType | null>(null);
