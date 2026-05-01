import React from 'react';
import { BASE_START_MIN, fmtHM } from '../../utils/time';
import { usePixelPerMin } from '../../hooks/usePixelPerMin';
import styles from './Calendar.module.css';

interface EventBlockProps {
  title: string;
  startMin: number;
  endMin: number;
  type: 'course' | 'focus' | 'deadline';
  detail?: unknown;
  onClick?: () => void;
  location?: string;
  teacher?: string;
}

export const EventBlock: React.FC<EventBlockProps> = ({ title, startMin, endMin, type, onClick, location, teacher }) => {
  const pixelPerMin = usePixelPerMin();

  const top = Math.max(0, (startMin - BASE_START_MIN) * pixelPerMin);
  const height = Math.max(18, (endMin - startMin) * pixelPerMin);

  return (
    <div
      className={`${styles.event} ${styles[type]}`}
      style={{ top, height, minHeight: height, position: 'absolute', width: '90%', left: '5%' }}
      onClick={onClick}
    >
      <span className={styles.title}>{title}</span>
      <div className={styles.meta}>{fmtHM(startMin)} - {fmtHM(endMin)}</div>
      {location && <div className={styles.meta} style={{ fontSize: '10px' }}>{location}</div>}
      {teacher && <div className={styles.meta} style={{ fontSize: '10px' }}>{teacher}</div>}
    </div>
  );
};
