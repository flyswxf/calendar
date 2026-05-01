/**
 * 全局数据存储上下文
 * 统一管理 5 类实体数据（tasks / courses / focusSessions / deadlineEvents / dailyActionEvents）
 * 提供 localStorage 自动持久化 + Supabase 云同步
 */
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Task, Course, FocusSession, DeadlineEvent, DailyActionEvent } from '../types/index';
import { isSupabaseConfigured, supabase } from '../utils/supabaseClient';

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

const StorageContext = createContext<StorageContextType | null>(null);

export const useStorage = () => {
  const context = useContext(StorageContext);
  if (!context) throw new Error('useStorage must be used within a StorageProvider');
  return context;
};

/**
 * 当前快照类型 —— 传入 saveToRemote 时需要五类数据的一次完整快照
 */
type StateSnapshot = {
  tasks: Task[];
  courses: Course[];
  focusSessions: FocusSession[];
  deadlineEvents: DeadlineEvent[];
  dailyActionEvents: DailyActionEvent[];
  semesterStartDate: string | null;
};

/**
 * 工厂函数：创建一个同时写 localStorage 并触发云同步的 setter
 * 消除 setTasks/setCourses/setFocusSessions/setDeadlineEvents/setDailyActionEvents 的五次重复
 */
function createSyncedSetter<T>(
  setState: React.Dispatch<React.SetStateAction<T>>,
  storageKey: string,
  updateSnapshot: (prev: T, next: T) => Partial<StateSnapshot>,
) {
  return (
    action: React.SetStateAction<T>,
    snapshot: StateSnapshot,
    saveToRemote: (s: StateSnapshot) => void,
  ) => {
    setState((prev) => {
      const next = typeof action === 'function' ? (action as (prevState: T) => T)(prev) : action;
      localStorage.setItem(storageKey, JSON.stringify(next));
      saveToRemote({ ...snapshot, ...updateSnapshot(prev, next) });
      return next;
    });
  };
}

export const StorageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ---- 5 类业务实体 state ----
  const [tasks, setTasksState] = useState<Task[]>([]);
  const [courses, setCoursesState] = useState<Course[]>([]);
  const [focusSessions, setFocusSessionsState] = useState<FocusSession[]>([]);
  const [deadlineEvents, setDeadlineEventsState] = useState<DeadlineEvent[]>([]);
  const [dailyActionEvents, setDailyActionEventsState] = useState<DailyActionEvent[]>([]);
  const [semesterStartDate, setSemesterStartDateState] = useState<string | null>(null);

  // ---- 认证 / 同步 ----
  const [syncUserId, setSyncUserIdState] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  // ---- 本地初始化：从 localStorage 恢复数据 ----
  useEffect(() => {
    try {
      setTasksState(JSON.parse(localStorage.getItem('tasks') || '[]'));
      setCoursesState(JSON.parse(localStorage.getItem('courses') || '[]'));
      setFocusSessionsState(JSON.parse(localStorage.getItem('focusSessions') || '[]'));
      setDeadlineEventsState(JSON.parse(localStorage.getItem('deadlineEvents') || '[]'));
      setDailyActionEventsState(JSON.parse(localStorage.getItem('dailyActionEvents') || '[]'));
      setSemesterStartDateState(localStorage.getItem('semesterStartDate'));
      setSyncUserIdState(localStorage.getItem('syncUserId'));
    } catch (e) {
      console.error('Failed to load from localStorage', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ---- Supabase 会话监听 ----
  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    let mounted = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        const user = data.session?.user ?? null;
        setSyncUserIdState(user?.id ?? null);
        setAuthEmail(user?.email ?? null);
        setAuthLoading(false);
      })
      .catch(() => {
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

  // ---- 登录后拉取远端数据 ----
  const loadRemotePayload = useCallback((payload: Record<string, unknown>) => {
    if (Array.isArray(payload.tasks)) setTasksState(payload.tasks);
    if (Array.isArray(payload.courses)) setCoursesState(payload.courses);
    if (Array.isArray(payload.focusSessions)) setFocusSessionsState(payload.focusSessions);
    if (Array.isArray(payload.deadlineEvents)) setDeadlineEventsState(payload.deadlineEvents);
    if (Array.isArray(payload.dailyActionEvents)) setDailyActionEventsState(payload.dailyActionEvents);
    if (payload.semesterStartDate !== undefined)
      setSemesterStartDateState(payload.semesterStartDate as string | null);
  }, []);

  useEffect(() => {
    if (!syncUserId || !supabase) return;
    localStorage.setItem('syncUserId', syncUserId);

    supabase
      .from('calendar_state')
      .select('payload')
      .eq('user_id', syncUserId)
      .maybeSingle()
      .then(
        ({ data, error }) => {
          if (error) {
            console.error('Failed to load from Supabase', error);
            return;
          }
          if (data?.payload && typeof data.payload === 'object') {
            loadRemotePayload(data.payload as Record<string, unknown>);
          }
        },
        (err: unknown) => console.error('Failed to load from remote', err),
      );
  }, [syncUserId, loadRemotePayload]);

  // ---- 向远端推送快照 ----
  const saveToRemote = useCallback(
    async (snapshot: StateSnapshot) => {
      if (!syncUserId || !supabase) return;
      try {
        const { error } = await supabase.from('calendar_state').upsert(
          {
            user_id: syncUserId,
            payload: snapshot,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        );
        if (error) console.error('Failed to save to Supabase', error);
      } catch (e) {
        console.error('Failed to save to remote', e);
      }
    },
    [syncUserId],
  );

  // 当前五类数据的一次快照引用（供 setter 闭包使用）
  const getSnapshot = useCallback(
    (): StateSnapshot => ({
      tasks,
      courses,
      focusSessions,
      deadlineEvents,
      dailyActionEvents,
      semesterStartDate,
    }),
    [tasks, courses, focusSessions, deadlineEvents, dailyActionEvents, semesterStartDate],
  );

  // ---- 五类数据 setter（工厂函数批量生成）----
  const setTasks = useCallback(
    (action: React.SetStateAction<Task[]>) => {
      createSyncedSetter(setTasksState, 'tasks', (_prev, next) => ({
        tasks: next,
      }))(action, getSnapshot(), saveToRemote);
    },
    [getSnapshot, saveToRemote],
  );

  const setCourses = useCallback(
    (action: React.SetStateAction<Course[]>) => {
      createSyncedSetter(setCoursesState, 'courses', (_prev, next) => ({
        courses: next,
      }))(action, getSnapshot(), saveToRemote);
    },
    [getSnapshot, saveToRemote],
  );

  const setFocusSessions = useCallback(
    (action: React.SetStateAction<FocusSession[]>) => {
      createSyncedSetter(setFocusSessionsState, 'focusSessions', (_prev, next) => ({
        focusSessions: next,
      }))(action, getSnapshot(), saveToRemote);
    },
    [getSnapshot, saveToRemote],
  );

  const setDeadlineEvents = useCallback(
    (action: React.SetStateAction<DeadlineEvent[]>) => {
      createSyncedSetter(setDeadlineEventsState, 'deadlineEvents', (_prev, next) => ({
        deadlineEvents: next,
      }))(action, getSnapshot(), saveToRemote);
    },
    [getSnapshot, saveToRemote],
  );

  const setDailyActionEvents = useCallback(
    (action: React.SetStateAction<DailyActionEvent[]>) => {
      createSyncedSetter(setDailyActionEventsState, 'dailyActionEvents', (_prev, next) => ({
        dailyActionEvents: next,
      }))(action, getSnapshot(), saveToRemote);
    },
    [getSnapshot, saveToRemote],
  );

  // ---- 学期起始日 & syncUserId 变更逻辑稍有不同，保留独立实现 ----
  const setSyncUserId = useCallback((id: string | null) => {
    setSyncUserIdState(id);
    id ? localStorage.setItem('syncUserId', id) : localStorage.removeItem('syncUserId');
  }, []);

  const setSemesterStartDate = useCallback(
    (date: string | null) => {
      setSemesterStartDateState((prevDate) => {
        if (prevDate === date) return prevDate;
        saveToRemote({
          tasks,
          courses,
          focusSessions,
          deadlineEvents,
          dailyActionEvents,
          semesterStartDate: date,
        });
        return date;
      });
      date ? localStorage.setItem('semesterStartDate', date) : localStorage.removeItem('semesterStartDate');
    },
    [tasks, courses, focusSessions, deadlineEvents, dailyActionEvents, saveToRemote],
  );

  // ---- 认证 API ----
  const sendLoginCode = useCallback(async (email: string) => {
    if (!supabase) return { ok: false, message: '未配置 Supabase 环境变量' };
    const normalized = email.trim().toLowerCase();
    if (!normalized) return { ok: false, message: '请输入邮箱' };
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: '登录邮件已发送，请在邮箱中点击链接完成登录' };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const syncNow = useCallback(async () => {
    await saveToRemote({
      tasks,
      courses,
      focusSessions,
      deadlineEvents,
      dailyActionEvents,
      semesterStartDate,
    });
  }, [tasks, courses, focusSessions, deadlineEvents, dailyActionEvents, semesterStartDate, saveToRemote]);

  // ---- context value（useMemo 避免每次渲染重建） ----
  const value = useMemo<StorageContextType>(
    () => ({
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
      loading,
    }),
    [
      tasks,
      courses,
      focusSessions,
      deadlineEvents,
      dailyActionEvents,
      semesterStartDate,
      authEmail,
      authLoading,
      setTasks,
      setCourses,
      setFocusSessions,
      setDeadlineEvents,
      setDailyActionEvents,
      syncUserId,
      sendLoginCode,
      signOut,
      syncNow,
      loading,
    ],
  );

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
};
