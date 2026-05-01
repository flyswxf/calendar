import React from 'react';
import type { DailyActionEvent } from '../../../types';
import { pad } from '../../../utils/time';
import type { EditDraft } from '../dailyActionShared';
import { durationBuckets, getEventDurationMin, nearestBucket } from '../dailyActionShared';
import styles from '../DailyActionPanel.module.css';

type Props = {
  now: Date;
  todayEvents: DailyActionEvent[];
  editDraft: EditDraft | null;
  setEditDraft: React.Dispatch<React.SetStateAction<EditDraft | null>>;
  onSaveEdit: () => void;
  onStartEdit: (event: DailyActionEvent) => void;
  onDelete: (id: string) => void;
};

export const EventListCard: React.FC<Props> = ({
  now,
  todayEvents,
  editDraft,
  setEditDraft,
  onSaveEdit,
  onStartEdit,
  onDelete
}) => {
  return (
    <div className={styles.card}>
      <h4>今日事件明细</h4>
      <div className={styles.eventList}>
        {todayEvents.length === 0 && <div className={styles.muted}>暂无记录</div>}
        {todayEvents.map((event) => {
          const start = new Date(event.startAt);
          const endText = event.endAt ? new Date(event.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '进行中';
          const duration = getEventDurationMin(event, now);
          const isEditing = editDraft?.id === event.id;
          return (
            <div key={event.id} className={styles.eventItem}>
              <div>
                {isEditing ? (
                  <div className={styles.editGrid}>
                    <input className={styles.input} list="daily-action-name-list" value={editDraft?.name ?? ''} onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, name: e.target.value } : prev))} />
                    <div className={styles.row}>
                      <select className={styles.select} value={editDraft?.startHour ?? start.getHours()} onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, startHour: Number(e.target.value) } : prev))}>
                        {Array.from({ length: 24 }, (_, index) => <option key={`edit-hour-${event.id}-${index}`} value={index}>{pad(index)}时</option>)}
                      </select>
                      <select className={styles.select} value={editDraft?.startMinute ?? Math.floor(start.getMinutes() / 5) * 5} onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, startMinute: Number(e.target.value) } : prev))}>
                        {Array.from({ length: 12 }, (_, index) => index * 5).map((minute) => <option key={`edit-minute-${event.id}-${minute}`} value={minute}>{pad(minute)}分</option>)}
                      </select>
                      <select className={styles.select} value={editDraft?.durationMin ?? nearestBucket(duration)} onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, durationMin: Number(e.target.value) } : prev))}>
                        {durationBuckets.map((bucket) => <option key={`edit-duration-${event.id}-${bucket}`} value={bucket}>{bucket} 分钟</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  <>
                    <strong>{event.name}</strong>
                    <p>
                      {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endText} {' · '} {duration} 分钟 {' · '} {event.source}
                    </p>
                  </>
                )}
              </div>
              <div className={styles.row}>
                {isEditing ? (
                  <>
                    <button className={`${styles.btn} ${styles.primary}`} onClick={onSaveEdit}>保存</button>
                    <button className={styles.btn} onClick={() => setEditDraft(null)}>取消</button>
                  </>
                ) : (
                  <button className={styles.btn} onClick={() => onStartEdit(event)}>编辑</button>
                )}
                <button className={`${styles.btn} ${styles.danger}`} onClick={() => onDelete(event.id)}>删除</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
