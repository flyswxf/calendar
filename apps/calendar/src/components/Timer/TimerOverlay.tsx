/**
 * 专注定时器弹窗
 * 倒计时 / 正计时模式，完成后自动记录 FocusSession 并标记任务完成
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTimer } from '../../context/TimerContext';
import { useStorage } from '../../context/StorageContext';
import { formatHMS } from '../../utils/time';
import { FocusSession } from '../../types';
import styles from './TimerOverlay.module.css';

type TimerMode = 'countdown' | 'stopwatch';
type TimerState = 'idle' | 'running' | 'paused';

export const TimerOverlay: React.FC = () => {
  const { closeTimer, currentTask } = useTimer();
  const { setFocusSessions, setTasks } = useStorage();

  const [mode, setMode] = useState<TimerMode>('countdown');
  const [state, setState] = useState<TimerState>('idle');
  const [targetMinutes, setTargetMinutes] = useState(60);
  const [elapsed, setElapsed] = useState(0);

  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  // 用 ref 避免闭包陈旧问题
  const modeRef = useRef(mode);
  const targetMinutesRef = useRef(targetMinutes);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    targetMinutesRef.current = targetMinutes;
  }, [targetMinutes]);

  /** 记录完成会话 + 标记任务完成 */
  const finishTimer = useCallback(() => {
    if (!startTimeRef.current) return;
    const now = Date.now();
    const newSession: FocusSession = {
      id: crypto.randomUUID(),
      title: currentTask?.text || '专注',
      start: new Date(startTimeRef.current).toISOString(),
      end: new Date(now).toISOString(),
      mode: modeRef.current,
      completed: true,
    };
    setFocusSessions((prev) => [...prev, newSession]);
    if (currentTask) {
      setTasks((prev) => prev.map((t) => (t.id === currentTask.id ? { ...t, completed: true } : t)));
    }
    reset();
    closeTimer();
  }, [currentTask, setFocusSessions, setTasks, closeTimer]);

  /** 终止：记录未完成会话并关闭 */
  const stopTimer = () => {
    if (state !== 'idle' && startTimeRef.current) {
      const newSession: FocusSession = {
        id: crypto.randomUUID(),
        title: currentTask?.text || '专注',
        start: new Date(startTimeRef.current).toISOString(),
        end: new Date().toISOString(),
        mode: modeRef.current,
        completed: false,
      };
      setFocusSessions((prev) => [...prev, newSession]);
    }
    reset();
    closeTimer();
  };

  const reset = () => {
    setState('idle');
    setElapsed(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    startTimeRef.current = 0;
    pausedTimeRef.current = 0;
    pausedAtRef.current = 0;
  };

  /** 每 250ms 更新 elapsed */
  const tick = useCallback(() => {
    const now = Date.now();
    const currentElapsed = now - startTimeRef.current - pausedTimeRef.current;
    setElapsed(currentElapsed);
    if (modeRef.current === 'countdown') {
      const targetMs = targetMinutesRef.current * 60 * 1000;
      if (currentElapsed >= targetMs) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        finishTimer();
      }
    }
  }, [finishTimer]);

  const tickRef = useRef(tick);
  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  const startTimer = () => {
    if (state === 'running') return;
    if (state === 'idle') {
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
    } else if (state === 'paused') {
      pausedTimeRef.current += Date.now() - pausedAtRef.current;
    }
    setState('running');
    intervalRef.current = window.setInterval(() => tickRef.current(), 250);
  };

  const pauseTimer = () => {
    if (state !== 'running') return;
    setState('paused');
    pausedAtRef.current = Date.now();
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const displayTime = () => {
    if (mode === 'stopwatch') return formatHMS(elapsed);
    return formatHMS(Math.max(0, targetMinutes * 60 * 1000 - elapsed));
  };

  return (
    <div className={styles.overlay} aria-hidden="false">
      <div className={styles.panel}>
        <div className={styles.header}>
          <span style={{ fontWeight: 'bold', fontSize: '1.2em' }}>{currentTask?.text || '专注'}</span>
          <button className={styles.close} onClick={stopTimer}>
            ×
          </button>
        </div>

        <div className={styles.body}>
          {/* 空闲态：模式选择 */}
          {state === 'idle' && (
            <div className={styles.mode}>
              <label>
                <input
                  type="radio"
                  name="timerMode"
                  checked={mode === 'countdown'}
                  onChange={() => setMode('countdown')}
                />{' '}
                倒计时
              </label>
              <label>
                <input
                  type="radio"
                  name="timerMode"
                  checked={mode === 'stopwatch'}
                  onChange={() => setMode('stopwatch')}
                />{' '}
                正计时
              </label>
            </div>
          )}

          {/* 空闲态：倒计时时长设置 */}
          {state === 'idle' && mode === 'countdown' && (
            <div className={styles.setup}>
              <button onClick={() => setTargetMinutes((m) => Math.max(1, m - 5))} style={{ marginRight: 10 }}>
                -
              </button>
              <span className={styles.timeNumber}>{targetMinutes}</span>
              <span className={styles.timeSuffix}>分钟</span>
              <button onClick={() => setTargetMinutes((m) => m + 5)} style={{ marginLeft: 10 }}>
                +
              </button>
            </div>
          )}

          {/* 时间显示 */}
          <div className={styles.runningTime}>{displayTime()}</div>

          {/* 操作按钮 */}
          <div className={styles.actions}>
            {state === 'idle' ? (
              <button className={styles.startBtn} onClick={startTimer}>
                开始
              </button>
            ) : (
              <>
                <button className={styles.pauseBtn} onClick={state === 'running' ? pauseTimer : startTimer}>
                  {state === 'running' ? '暂停' : '继续'}
                </button>
                <button className={styles.finishBtn} onClick={finishTimer}>
                  完成
                </button>
                <button className={styles.stopBtn} onClick={stopTimer}>
                  终止
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
