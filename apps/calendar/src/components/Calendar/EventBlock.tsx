import React from 'react';
import { BASE_START_MIN, fmtHM } from '../../utils/time';
import { usePixelPerMin } from '../../hooks/usePixelPerMin';

interface EventBlockProps {
  title: string;
  startMin: number; // minutes from midnight
  endMin: number;
  type: 'course' | 'focus';
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
      className={`event ${type}`} 
      style={{ top, height, minHeight: height, position: 'absolute', width: '90%', left: '5%' }}
      onClick={onClick}
    >
      <span className="title">{title}</span>
      <div className="meta">{fmtHM(startMin)} - {fmtHM(endMin)}</div>
      {location && <div className="meta" style={{ fontSize: '10px' }}>📍 {location}</div>}
      {teacher && <div className="meta" style={{ fontSize: '10px' }}>👤 {teacher}</div>}
    </div>
  );
};
