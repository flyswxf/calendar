import React, { useEffect, useState, useCallback } from 'react';
import { Task, Course, FocusSession, DeadlineEvent } from '../types/index';
import { StorageContext } from './StorageContextObject';

function resolveNextState<T>(action: React.SetStateAction<T>, prev: T): T {
  return typeof action === 'function' ? (action as (prevState: T) => T)(prev) : action;
}

export const StorageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasksState] = useState<Task[]>([]);
  const [courses, setCoursesState] = useState<Course[]>([]);
  const [focusSessions, setFocusSessionsState] = useState<FocusSession[]>([]);
  const [deadlineEvents, setDeadlineEventsState] = useState<DeadlineEvent[]>([]);
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
      const localSemesterStart = localStorage.getItem('semesterStartDate');
      const localSyncUserId = localStorage.getItem('syncUserId');

      setTasksState(localTasks);
      setCoursesState(localCourses);
      setFocusSessionsState(localFocusSessions);
      setDeadlineEventsState(localDeadlineEvents);
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
  
  const saveToRemote = useCallback(async (data: { tasks: Task[], courses: Course[], focusSessions: FocusSession[], deadlineEvents: DeadlineEvent[] }) => {
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
      saveToRemote({ tasks: newTasks, courses, focusSessions, deadlineEvents });
      return newTasks;
    });
  }, [courses, focusSessions, deadlineEvents, saveToRemote]);

  const setCourses = useCallback((action: React.SetStateAction<Course[]>) => {
    setCoursesState(prev => {
      const newCourses = resolveNextState(action, prev);
      localStorage.setItem('courses', JSON.stringify(newCourses));
      saveToRemote({ tasks, courses: newCourses, focusSessions, deadlineEvents });
      return newCourses;
    });
  }, [tasks, focusSessions, deadlineEvents, saveToRemote]);

  const setFocusSessions = useCallback((action: React.SetStateAction<FocusSession[]>) => {
    setFocusSessionsState(prev => {
      const newSessions = resolveNextState(action, prev);
      localStorage.setItem('focusSessions', JSON.stringify(newSessions));
      saveToRemote({ tasks, courses, focusSessions: newSessions, deadlineEvents });
      return newSessions;
    });
  }, [tasks, courses, deadlineEvents, saveToRemote]);

  const setDeadlineEvents = useCallback((action: React.SetStateAction<DeadlineEvent[]>) => {
    setDeadlineEventsState(prev => {
      const newDeadlines = resolveNextState(action, prev);
      localStorage.setItem('deadlineEvents', JSON.stringify(newDeadlines));
      saveToRemote({ tasks, courses, focusSessions, deadlineEvents: newDeadlines });
      return newDeadlines;
    });
  }, [tasks, courses, focusSessions, saveToRemote]);

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
    semesterStartDate,
    setTasks,
    setCourses,
    setFocusSessions,
    setDeadlineEvents,
    setSemesterStartDate,
    syncUserId,
    setSyncUserId,
    loading
  };

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
};
