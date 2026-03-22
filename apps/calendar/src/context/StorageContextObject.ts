import { createContext } from 'react';
import { Course, DailyActionEvent, DeadlineEvent, FocusSession, Task } from '../types';

export interface StorageContextType {
  tasks: Task[];
  courses: Course[];
  focusSessions: FocusSession[];
  deadlineEvents: DeadlineEvent[];
  dailyActionEvents: DailyActionEvent[];
  semesterStartDate: string | null;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  setFocusSessions: React.Dispatch<React.SetStateAction<FocusSession[]>>;
  setDeadlineEvents: React.Dispatch<React.SetStateAction<DeadlineEvent[]>>;
  setDailyActionEvents: React.Dispatch<React.SetStateAction<DailyActionEvent[]>>;
  setSemesterStartDate: (date: string | null) => void;
  syncUserId: string | null;
  setSyncUserId: (id: string) => void;
  loading: boolean;
}

export const StorageContext = createContext<StorageContextType | null>(null);
