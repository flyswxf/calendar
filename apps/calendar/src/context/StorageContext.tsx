import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Task, Course, FocusSession } from '../types/index';

interface StorageContextType {
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

const StorageContext = createContext<StorageContextType | null>(null);

export const useStorage = () => {
  const context = useContext(StorageContext);
  if (!context) throw new Error('useStorage must be used within a StorageProvider');
  return context;
};

export const StorageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasksState] = useState<Task[]>([]);
  const [courses, setCoursesState] = useState<Course[]>([]);
  const [focusSessions, setFocusSessionsState] = useState<FocusSession[]>([]);
  const [semesterStartDate, setSemesterStartDateState] = useState<string | null>(null);
  const [syncUserId, setSyncUserIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial load from localStorage
  useEffect(() => {
    try {
      const localTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      const localCourses = JSON.parse(localStorage.getItem('courses') || '[]');
      const localFocusSessions = JSON.parse(localStorage.getItem('focusSessions') || '[]');
      const localSemesterStart = localStorage.getItem('semesterStartDate');
      const localSyncUserId = localStorage.getItem('syncUserId');

      setTasksState(localTasks);
      setCoursesState(localCourses);
      setFocusSessionsState(localFocusSessions);
      setSemesterStartDateState(localSemesterStart);
      setSyncUserIdState(localSyncUserId);
    } catch (e) {
      console.error('Failed to load from localStorage', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync with remote when syncUserId changes or on init
  useEffect(() => {
    if (!syncUserId) return;
    localStorage.setItem('syncUserId', syncUserId);
    
    const loadRemote = async () => {
      try {
        const res = await fetch(`/api/data?userId=${encodeURIComponent(syncUserId)}`);
        if (res.ok) {
          const j = await res.json();
          if (Array.isArray(j.tasks)) setTasksState(j.tasks);
          if (Array.isArray(j.courses)) setCoursesState(j.courses);
          if (Array.isArray(j.focusSessions)) setFocusSessionsState(j.focusSessions);
        }
      } catch (e) {
        console.error('Failed to load from remote', e);
      }
    };
    loadRemote();
  }, [syncUserId]);

  // Save to localStorage and Remote whenever data changes
  // Note: To avoid infinite loops or excessive writes, we might want to debounce this
  // But for now, we follow the original logic which saved on every update.
  
  const saveToRemote = async (data: { tasks: Task[], courses: Course[], focusSessions: FocusSession[] }) => {
    if (!syncUserId) return;
    try {
      await fetch(`/api/data?userId=${encodeURIComponent(syncUserId)}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (e) {
      console.error('Failed to save to remote', e);
    }
  };

  const setTasks = useCallback((action: React.SetStateAction<Task[]>) => {
    setTasksState(prev => {
      const newTasks = typeof action === 'function' ? (action as any)(prev) : action;
      localStorage.setItem('tasks', JSON.stringify(newTasks));
      saveToRemote({ tasks: newTasks, courses, focusSessions });
      return newTasks;
    });
  }, [courses, focusSessions, syncUserId]);

  const setCourses = useCallback((action: React.SetStateAction<Course[]>) => {
    setCoursesState(prev => {
      const newCourses = typeof action === 'function' ? (action as any)(prev) : action;
      localStorage.setItem('courses', JSON.stringify(newCourses));
      saveToRemote({ tasks, courses: newCourses, focusSessions });
      return newCourses;
    });
  }, [tasks, focusSessions, syncUserId]);

  const setFocusSessions = useCallback((action: React.SetStateAction<FocusSession[]>) => {
    setFocusSessionsState(prev => {
      const newSessions = typeof action === 'function' ? (action as any)(prev) : action;
      localStorage.setItem('focusSessions', JSON.stringify(newSessions));
      saveToRemote({ tasks, courses, focusSessions: newSessions });
      return newSessions;
    });
  }, [tasks, courses, syncUserId]);

  const setSyncUserId = useCallback((id: string) => {
    setSyncUserIdState(id);
  }, []);

  const setSemesterStartDate = useCallback((date: string | null) => {
    setSemesterStartDateState(date);
    if (date) {
      localStorage.setItem('semesterStartDate', date);
    } else {
      localStorage.removeItem('semesterStartDate');
    }
  }, []);

  const value = {
    tasks,
    courses,
    focusSessions,
    semesterStartDate,
    setTasks,
    setCourses,
    setFocusSessions,
    setSemesterStartDate,
    syncUserId,
    setSyncUserId,
    loading
  };

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
};
