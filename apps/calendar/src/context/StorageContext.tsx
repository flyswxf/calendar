import React, { useEffect, useState, useCallback } from 'react';
import { Task, Course, FocusSession, DeadlineEvent, DailyActionEvent } from '../types/index';
import { StorageContext } from './StorageContextObject';
import { isSupabaseConfigured, supabase } from '../utils/supabaseClient';

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
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  const loadPayloadToState = useCallback((payload: Partial<{
    tasks: Task[];
    courses: Course[];
    focusSessions: FocusSession[];
    deadlineEvents: DeadlineEvent[];
    dailyActionEvents: DailyActionEvent[];
    semesterStartDate: string | null;
  }>) => {
    if (Array.isArray(payload.tasks)) setTasksState(payload.tasks);
    if (Array.isArray(payload.courses)) setCoursesState(payload.courses);
    if (Array.isArray(payload.focusSessions)) setFocusSessionsState(payload.focusSessions);
    if (Array.isArray(payload.deadlineEvents)) setDeadlineEventsState(payload.deadlineEvents);
    if (Array.isArray(payload.dailyActionEvents)) setDailyActionEventsState(payload.dailyActionEvents);
    if (payload.semesterStartDate !== undefined) setSemesterStartDateState(payload.semesterStartDate ?? null);
  }, []);

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

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const user = data.session?.user ?? null;
      setSyncUserIdState(user?.id ?? null);
      setAuthEmail(user?.email ?? null);
      setAuthLoading(false);
    }).catch(() => {
      if (!mounted) return;
      setAuthLoading(false);
    });

    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setSyncUserIdState(user?.id ?? null);
      setAuthEmail(user?.email ?? null);
    });

    return () => {
      mounted = false;
      authSub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!syncUserId) return;
    localStorage.setItem('syncUserId', syncUserId);

    const loadRemote = async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('calendar_state')
          .select('payload')
          .eq('user_id', syncUserId)
          .maybeSingle();
        if (error) {
          console.error('Failed to load from Supabase', error);
          return;
        }
        if (!data?.payload || typeof data.payload !== 'object') return;
        loadPayloadToState(data.payload as Record<string, unknown>);
      } catch (e) {
        console.error('Failed to load from remote', e);
      }
    };
    loadRemote();
  }, [loadPayloadToState, syncUserId]);

  const saveToRemote = useCallback(async (payload: {
    tasks: Task[];
    courses: Course[];
    focusSessions: FocusSession[];
    deadlineEvents: DeadlineEvent[];
    dailyActionEvents: DailyActionEvent[];
    semesterStartDate: string | null;
  }) => {
    if (!syncUserId) return;
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('calendar_state')
        .upsert({
          user_id: syncUserId,
          payload,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      if (error) {
        console.error('Failed to save to Supabase', error);
      }
    } catch (e) {
      console.error('Failed to save to remote', e);
    }
  }, [syncUserId]);

  const setTasks = useCallback((action: React.SetStateAction<Task[]>) => {
    setTasksState(prev => {
      const newTasks = resolveNextState(action, prev);
      localStorage.setItem('tasks', JSON.stringify(newTasks));
      saveToRemote({ tasks: newTasks, courses, focusSessions, deadlineEvents, dailyActionEvents, semesterStartDate });
      return newTasks;
    });
  }, [courses, focusSessions, deadlineEvents, dailyActionEvents, saveToRemote, semesterStartDate]);

  const setCourses = useCallback((action: React.SetStateAction<Course[]>) => {
    setCoursesState(prev => {
      const newCourses = resolveNextState(action, prev);
      localStorage.setItem('courses', JSON.stringify(newCourses));
      saveToRemote({ tasks, courses: newCourses, focusSessions, deadlineEvents, dailyActionEvents, semesterStartDate });
      return newCourses;
    });
  }, [tasks, focusSessions, deadlineEvents, dailyActionEvents, saveToRemote, semesterStartDate]);

  const setFocusSessions = useCallback((action: React.SetStateAction<FocusSession[]>) => {
    setFocusSessionsState(prev => {
      const newSessions = resolveNextState(action, prev);
      localStorage.setItem('focusSessions', JSON.stringify(newSessions));
      saveToRemote({ tasks, courses, focusSessions: newSessions, deadlineEvents, dailyActionEvents, semesterStartDate });
      return newSessions;
    });
  }, [tasks, courses, deadlineEvents, dailyActionEvents, saveToRemote, semesterStartDate]);

  const setDeadlineEvents = useCallback((action: React.SetStateAction<DeadlineEvent[]>) => {
    setDeadlineEventsState(prev => {
      const newDeadlines = resolveNextState(action, prev);
      localStorage.setItem('deadlineEvents', JSON.stringify(newDeadlines));
      saveToRemote({ tasks, courses, focusSessions, deadlineEvents: newDeadlines, dailyActionEvents, semesterStartDate });
      return newDeadlines;
    });
  }, [tasks, courses, focusSessions, dailyActionEvents, saveToRemote, semesterStartDate]);

  const setDailyActionEvents = useCallback((action: React.SetStateAction<DailyActionEvent[]>) => {
    setDailyActionEventsState(prev => {
      const newEvents = resolveNextState(action, prev);
      localStorage.setItem('dailyActionEvents', JSON.stringify(newEvents));
      saveToRemote({ tasks, courses, focusSessions, deadlineEvents, dailyActionEvents: newEvents, semesterStartDate });
      return newEvents;
    });
  }, [tasks, courses, focusSessions, deadlineEvents, saveToRemote, semesterStartDate]);

  const setSyncUserId = useCallback((id: string | null) => {
    setSyncUserIdState(id);
    if (id) {
      localStorage.setItem('syncUserId', id);
      return;
    }
    localStorage.removeItem('syncUserId');
  }, []);

  const setSemesterStartDate = useCallback((date: string | null) => {
    setSemesterStartDateState(prevDate => {
      if (prevDate === date) return prevDate;
      saveToRemote({ tasks, courses, focusSessions, deadlineEvents, dailyActionEvents, semesterStartDate: date });
      return date;
    });
    if (date) {
      localStorage.setItem('semesterStartDate', date);
    } else {
      localStorage.removeItem('semesterStartDate');
    }
  }, [courses, dailyActionEvents, deadlineEvents, focusSessions, saveToRemote, tasks]);

  const sendLoginCode = useCallback(async (email: string) => {
    if (!supabase) return { ok: false, message: '未配置 Supabase 环境变量' };
    const normalized = email.trim().toLowerCase();
    if (!normalized) return { ok: false, message: '请输入邮箱' };
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: { emailRedirectTo: redirectTo }
    });
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: '登录邮件已发送，请在邮箱中点击链接完成登录' };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const syncNow = useCallback(async () => {
    await saveToRemote({ tasks, courses, focusSessions, deadlineEvents, dailyActionEvents, semesterStartDate });
  }, [courses, dailyActionEvents, deadlineEvents, focusSessions, saveToRemote, semesterStartDate, tasks]);

  const value = {
    tasks,
    courses,
    focusSessions,
    deadlineEvents,
    dailyActionEvents,
    semesterStartDate,
    isSupabaseConfigured,
    authEmail,
    authLoading,
    setTasks,
    setCourses,
    setFocusSessions,
    setDeadlineEvents,
    setDailyActionEvents,
    setSemesterStartDate,
    syncUserId,
    setSyncUserId,
    sendLoginCode,
    signOut,
    syncNow,
    loading
  };

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
};
