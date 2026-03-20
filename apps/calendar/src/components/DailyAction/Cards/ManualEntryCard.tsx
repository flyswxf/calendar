import React from 'react';
import { durationBuckets, pad2 } from '../dailyActionShared';

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
  onAdd
}) => {
  return (
    <div className="daily-action-card">
      <h4>手动补录</h4>
      <div className="daily-action-row">
        <input className="daily-action-input" list="daily-action-name-list" value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="事件名，例如：吃饭、刷手机、健身" />
        <button className="daily-action-btn primary" onClick={onAdd}>添加事件</button>
      </div>
      <div className="daily-action-row">
        <select className="daily-action-select" value={manualHour} onChange={(e) => setManualHour(Number(e.target.value))}>
          {Array.from({ length: 24 }, (_, index) => <option key={`manual-hour-${index}`} value={index}>{pad2(index)}时</option>)}
        </select>
        <select className="daily-action-select" value={manualMinute} onChange={(e) => setManualMinute(Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, index) => index * 5).map((minute) => <option key={`manual-minute-${minute}`} value={minute}>{pad2(minute)}分</option>)}
        </select>
        <select className="daily-action-select" value={manualDurationMin} onChange={(e) => setManualDurationMin(Number(e.target.value))}>
          {durationBuckets.map((duration) => <option key={`duration-${duration}`} value={duration}>{duration} 分钟</option>)}
        </select>
      </div>
    </div>
  );
};
