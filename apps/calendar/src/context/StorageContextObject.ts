import { createContext } from 'react';
import { Course, FocusSession, Task } from '../types';

export interface StorageContextType {
  tasks: Task[];
  courses: Course[];
  focusSessions: FocusSession[];
  semesterStartDate: string | null;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  setFocusSessions: React.Dispatch<React.SetStateAction<FocusSession[]>>;
  setSemesterStartDate: (date: string | null) => void;
  syncUserId: string | null;
  setSyncUserId: (id: string) => void;
  loading: boolean;
}

export const StorageContext = createContext<StorageContextType | null>(null);
