import React from 'react';
import { pad } from '../../../utils/time';
import type { ActiveSession } from '../dailyActionShared';
import styles from '../DailyActionPanel.module.css';

type Props = {
  runningName: string;
  setRunningName: (value: string) => void;
  activeSession: ActiveSession | null;
  adjustEndHour: number;
  setAdjustEndHour: (value: number) => void;
  adjustEndMinute: number;
  setAdjustEndMinute: (value: number) => void;
  onStart: () => void;
  onEnd: () => void;
};

export const RunningSessionCard: React.FC<Props> = ({
  runningName,
  setRunningName,
  activeSession,
  adjustEndHour,
  setAdjustEndHour,
  adjustEndMinute,
  setAdjustEndMinute,
  onStart,
  onEnd
}) => {
  return (
    <div className={styles.card}>
      <h4>开始 / 结束事件（可调整结束时间）</h4>
      <div className={styles.row}>
        <input className={styles.input} list="daily-action-name-list" value={runningName} onChange={(e) => setRunningName(e.target.value)} placeholder="当前正在做什么" disabled={Boolean(activeSession)} />
        <button className={`${styles.btn} ${styles.primary}`} onClick={onStart} disabled={Boolean(activeSession)}>开始</button>
      </div>
      {activeSession && (
        <div className={styles.running}>
          <span>{activeSession.name} · 开始于 {new Date(activeSession.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <div className={styles.row}>
            <select className={styles.select} value={adjustEndHour} onChange={(e) => setAdjustEndHour(Number(e.target.value))}>
              {Array.from({ length: 24 }, (_, index) => <option key={`adjust-hour-${index}`} value={index}>{pad(index)}时</option>)}
            </select>
            <select className={styles.select} value={adjustEndMinute} onChange={(e) => setAdjustEndMinute(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, index) => index * 5).map((minute) => <option key={`adjust-minute-${minute}`} value={minute}>{pad(minute)}分</option>)}
            </select>
            <button className={styles.btn} onClick={onEnd}>结束并保存</button>
          </div>
        </div>
      )}
    </div>
  );
};
