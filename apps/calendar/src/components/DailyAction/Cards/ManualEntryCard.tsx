/**
 * 手动补录卡片
 * 用户填写事件名称、开始时间、持续时长 → 添加到今日行动记录
 */
import React from 'react';
import { pad } from '../../../utils/time';
import { durationBuckets } from '../dailyActionShared';
import styles from '../DailyActionPanel.module.css';

type Props = {
  manualName: string;
  setManualName: (value: string) => void;
  manualHour: number;
  setManualHour: (value: number) => void;
  manualMinute: number;
  setManualMinute: (value: number) => void;
  manualDurationMin: number;
  setManualDurationMin: (value: number) => void;
  onAdd: () => void;
};

export const ManualEntryCard: React.FC<Props> = ({
  manualName,
  setManualName,
  manualHour,
  setManualHour,
  manualMinute,
  setManualMinute,
  manualDurationMin,
  setManualDurationMin,
  onAdd,
}) => {
  return (
    <div className={styles.card}>
      <h4>手动补录</h4>
      {/* 事件名 + 添加按钮 */}
      <div className={styles.row}>
        <input
          className={`${styles.input} input-base`}
          list="daily-action-name-list"
          value={manualName}
          onChange={(e) => setManualName(e.target.value)}
          placeholder="事件名，例如：吃饭、刷手机、健身"
        />
        <button className={`${styles.btn} btn-primary`} onClick={onAdd}>
          添加事件
        </button>
      </div>
      {/* 时/分/时长选择器 */}
      <div className={styles.row}>
        <select
          className={`${styles.select} input-base`}
          value={manualHour}
          onChange={(e) => setManualHour(Number(e.target.value))}
        >
          {Array.from({ length: 24 }, (_, i) => (
            <option key={i} value={i}>
              {pad(i)}时
            </option>
          ))}
        </select>
        <select
          className={`${styles.select} input-base`}
          value={manualMinute}
          onChange={(e) => setManualMinute(Number(e.target.value))}
        >
          {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
            <option key={m} value={m}>
              {pad(m)}分
            </option>
          ))}
        </select>
        <select
          className={`${styles.select} input-base`}
          value={manualDurationMin}
          onChange={(e) => setManualDurationMin(Number(e.target.value))}
        >
          {durationBuckets.map((d) => (
            <option key={d} value={d}>
              {d} 分钟
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
