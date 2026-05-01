/**
 * 进行会话卡片
 * 开始计时 → 调整结束时间 → 结束并保存
 */
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
  onEnd,
}) => {
  return (
    <div className={styles.card}>
      <h4>开始 / 结束事件（可调整结束时间）</h4>
      {!activeSession ? (
        /* 未开始：输入名称 + 点开始 */
        <div className={styles.row}>
          <input
            className={`${styles.input} input-base`}
            list="daily-action-name-list"
            value={runningName}
            onChange={(e) => setRunningName(e.target.value)}
            placeholder="当前正在做什么"
          />
          <button className={`${styles.btn} btn-primary`} onClick={onStart}>
            开始
          </button>
        </div>
      ) : (
        /* 已开始：显示时段 + 调整结束时间 */
        <div className={styles.running}>
          <span>
            {activeSession.name} · 开始于{' '}
            {new Date(activeSession.startAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <div className={styles.row}>
            <select
              className={`${styles.select} input-base`}
              value={adjustEndHour}
              onChange={(e) => setAdjustEndHour(Number(e.target.value))}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {pad(i)}时
                </option>
              ))}
            </select>
            <select
              className={`${styles.select} input-base`}
              value={adjustEndMinute}
              onChange={(e) => setAdjustEndMinute(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                <option key={m} value={m}>
                  {pad(m)}分
                </option>
              ))}
            </select>
            <button className={styles.btn} onClick={onEnd}>
              结束并保存
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
