import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTimer } from '../../context/TimerContext';
import { useStorage } from '../../context/StorageContext';
import { formatHMS } from '../../utils/time';
import { FocusSession } from '../../types';

type TimerMode = 'countdown' | 'stopwatch';
type TimerState = 'idle' | 'running' | 'paused';

export const TimerOverlay: React.FC = () => {
  const { closeTimer, currentTask } = useTimer();
  const { setFocusSessions, setTasks } = useStorage(); // removed focusSessions, tasks from destructuring to avoid stale closure issues if not using functional updates. 
  // But setTasks needs tasks for mapping.
  // So we must use functional updates or refs.
  // Or just rely on useStorage returning current values if context updates? 
  // Context updates trigger re-render of TimerOverlay.
  // So render scope variables are fresh.
  // But setInterval callback is closure created at start.
  
  // To solve this, we use a ref to hold the latest finishTimer function, or just use functional state updates everywhere.
  
  const [mode, setMode] = useState<TimerMode>('countdown');
  const [state, setState] = useState<TimerState>('idle');
  const [targetMinutes, setTargetMinutes] = useState(60);
  const [elapsed, setElapsed] = useState(0); 

  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  // We need a ref to access current mode/target inside the interval callback
  const modeRef = useRef(mode);
  const targetMinutesRef = useRef(targetMinutes);

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { targetMinutesRef.current = targetMinutes; }, [targetMinutes]);

  const finishTimer = useCallback(() => {
    if (!startTimeRef.current) return;
    const now = Date.now();
    
    const newSession: FocusSession = {
      id: crypto.randomUUID(),
      title: currentTask?.text || '专注',
      start: new Date(startTimeRef.current).toISOString(),
      end: new Date(now).toISOString(),
      mode: modeRef.current,
      completed: true
    };

    setFocusSessions(prev => [...prev, newSession]);

    if (currentTask) {
      setTasks(prev => prev.map(t => 
        t.id === currentTask.id ? { ...t, completed: true } : t
      ));
    }
    
    reset();
    closeTimer();
  }, [currentTask, setFocusSessions, setTasks, closeTimer]);

  const stopTimer = () => {
    if (state !== 'idle' && startTimeRef.current) {
      const now = Date.now();
      const newSession: FocusSession = {
        id: crypto.randomUUID(),
        title: currentTask?.text || '专注',
        start: new Date(startTimeRef.current).toISOString(),
        end: new Date(now).toISOString(),
        mode: modeRef.current,
        completed: false
      };
      setFocusSessions(prev => [...prev, newSession]);
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

  const tick = useCallback(() => {
    const now = Date.now();
    const currentElapsed = now - startTimeRef.current - pausedTimeRef.current;
    setElapsed(currentElapsed);

    if (modeRef.current === 'countdown') {
      const targetMs = targetMinutesRef.current * 60 * 1000;
      if (currentElapsed >= targetMs) {
        // Timer finished
        if (intervalRef.current) clearInterval(intervalRef.current);
        finishTimer();
      }
    }
  }, [finishTimer]);

  const tickRef = useRef(tick);
  useEffect(() => { tickRef.current = tick; }, [tick]);

  const startTimer = () => {
    if (state === 'running') return;
    
    if (state === 'idle') {
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
    } else if (state === 'paused') {
      const pauseDuration = Date.now() - pausedAtRef.current;
      pausedTimeRef.current += pauseDuration;
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
    const targetMs = targetMinutes * 60 * 1000;
    const remain = Math.max(0, targetMs - elapsed);
    return formatHMS(remain);
  };

  return (
    <div className="timer-overlay" aria-hidden="false">
      <div className="timer-panel">
        <div className="timer-header">
          <span id="timerTaskTitle" style={{ fontWeight: 'bold', fontSize: '1.2em' }}>{currentTask?.text || '专注'}</span>
          <button className="close-modal" id="exitTimer" onClick={stopTimer}>×</button>
        </div>
        
        <div className="timer-body">
          {state === 'idle' && (
            <div className="timer-mode">
              <label><input type="radio" name="timerMode" checked={mode==='countdown'} onChange={() => setMode('countdown')} /> 倒计时</label>
              <label><input type="radio" name="timerMode" checked={mode==='stopwatch'} onChange={() => setMode('stopwatch')} /> 正计时</label>
            </div>
          )}

          {state === 'idle' && mode === 'countdown' && (
            <div className="countdown-setup" id="countdownSetup">
              <button onClick={() => setTargetMinutes(m => Math.max(1, m-5))} style={{ marginRight: 10 }}>-</button>
              <span className="time-number" id="setupMinutes">{targetMinutes}</span>
              <span className="time-suffix">分钟</span>
              <button onClick={() => setTargetMinutes(m => m+5)} style={{ marginLeft: 10 }}>+</button>
            </div>
          )}

          <div className="running-time" id="runningTime">
            {displayTime()}
          </div>

          <div className="timer-actions">
            {state === 'idle' ? (
              <button id="startTimer" onClick={startTimer}>开始</button>
            ) : (
              <>
                {state === 'running' ? (
                  <button id="pauseTimer" onClick={pauseTimer}>暂停</button>
                ) : (
                  <button id="pauseTimer" onClick={startTimer}>继续</button>
                )}
                {/* Reset button logic can be added if needed, for now just keeping structure similar */}
                {/* <button id="resetTimer">重置</button> */}
                <button id="finishTimer" onClick={finishTimer}>完成</button>
                <button id="stopTimer" onClick={stopTimer}>终止</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
