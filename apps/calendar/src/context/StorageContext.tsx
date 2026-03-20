import React, { useEffect, useState, useCallback } from 'react';
import { Task, Course, FocusSession, DeadlineEvent, DailyActionEvent } from '../types/index';
import { StorageContext } from './StorageContextObject';

function resolveNextState<T>(action: React.SetStateAction<T>, prev: T): T {
  return typeof action === 'function' ? (action as (prevState: T) => T)(prev) : action;
}

export const StorageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasksState] = useState<Task[]>([]);
  const [courses, setCoursesState] = useState<Course[]>([]);
  const [focusSessions, setFocusSessionsState] = useState<FocusSession[]>([]);
  const [deadlineEvents, setDeadlineEventsState] = useState<DeadlineEvent[]>([]);
  const [dailyActionEvents, setDailyActionEventsState] = useState<DailyActionEvent[]>([]);
  const [semesterStartDate, setSemesterStartDateState] = useState<string | null>(null);
  const [syncUserId, setSyncUserIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial load from localStorage
  useEffect(() => {
    try {
      const localTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      const localCourses = JSON.parse(localStorage.getItem('courses') || '[]');
      const localFocusSessions = JSON.parse(localStorage.getItem('focusSessions') || '[]');
      const localDeadlineEvents = JSON.parse(localStorage.getItem('deadlineEvents') || '[]');
      const localDailyActionEvents = JSON.parse(localStorage.getItem('dailyActionEvents') || '[]');
      const localSemesterStart = localStorage.getItem('semesterStartDate');
      const localSyncUserId = localStorage.getItem('syncUserId');

      setTasksState(localTasks);
      setCoursesState(localCourses);
      setFocusSessionsState(localFocusSessions);
      setDeadlineEventsState(localDeadlineEvents);
      setDailyActionEventsState(localDailyActionEvents);
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
          if (Array.isArray(j.deadlineEvents)) setDeadlineEventsState(j.deadlineEvents);
          if (Array.isArray(j.dailyActionEvents)) setDailyActionEventsState(j.dailyActionEvents);
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
  
  const saveToRemote = useCallback(async (data: { tasks: Task[], courses: Course[], focusSessions: FocusSession[], deadlineEvents: DeadlineEvent[], dailyActionEvents: DailyActionEvent[] }) => {
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
  }, [syncUserId]);

  const setTasks = useCallback((action: React.SetStateAction<Task[]>) => {
    setTasksState(prev => {
      const newTasks = resolveNextState(action, prev);
      localStorage.setItem('tasks', JSON.stringify(newTasks));
      saveToRemote({ tasks: newTasks, courses, focusSessions, deadlineEvents, dailyActionEvents });
      return newTasks;
    });
  }, [courses, focusSessions, deadlineEvents, dailyActionEvents, saveToRemote]);

  const setCourses = useCallback((action: React.SetStateAction<Course[]>) => {
    setCoursesState(prev => {
      const newCourses = resolveNextState(action, prev);
      localStorage.setItem('courses', JSON.stringify(newCourses));
      saveToRemote({ tasks, courses: newCourses, focusSessions, deadlineEvents, dailyActionEvents });
      return newCourses;
    });
  }, [tasks, focusSessions, deadlineEvents, dailyActionEvents, saveToRemote]);

  const setFocusSessions = useCallback((action: React.SetStateAction<FocusSession[]>) => {
    setFocusSessionsState(prev => {
      const newSessions = resolveNextState(action, prev);
      localStorage.setItem('focusSessions', JSON.stringify(newSessions));
      saveToRemote({ tasks, courses, focusSessions: newSessions, deadlineEvents, dailyActionEvents });
      return newSessions;
    });
  }, [tasks, courses, deadlineEvents, dailyActionEvents, saveToRemote]);

  const setDeadlineEvents = useCallback((action: React.SetStateAction<DeadlineEvent[]>) => {
    setDeadlineEventsState(prev => {
      const newDeadlines = resolveNextState(action, prev);
      localStorage.setItem('deadlineEvents', JSON.stringify(newDeadlines));
      saveToRemote({ tasks, courses, focusSessions, deadlineEvents: newDeadlines, dailyActionEvents });
      return newDeadlines;
    });
  }, [tasks, courses, focusSessions, dailyActionEvents, saveToRemote]);

  const setDailyActionEvents = useCallback((action: React.SetStateAction<DailyActionEvent[]>) => {
    setDailyActionEventsState(prev => {
      const newEvents = resolveNextState(action, prev);
      localStorage.setItem('dailyActionEvents', JSON.stringify(newEvents));
      saveToRemote({ tasks, courses, focusSessions, deadlineEvents, dailyActionEvents: newEvents });
      return newEvents;
    });
  }, [tasks, courses, focusSessions, deadlineEvents, saveToRemote]);

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
    deadlineEvents,
    dailyActionEvents,
    semesterStartDate,
    setTasks,
    setCourses,
    setFocusSessions,
    setDeadlineEvents,
    setDailyActionEvents,
    setSemesterStartDate,
    syncUserId,
    setSyncUserId,
    loading
  };

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
};
