import React from 'react';
import { BASE_START_MIN, fmtHM } from '../../utils/time';
import { usePixelPerMin } from '../../hooks/usePixelPerMin';

interface EventBlockProps {
  title: string;
  startMin: number; // minutes from midnight
  endMin: number;
  type: 'course' | 'focus';
  detail?: any;
  onClick?: () => void;
}

export const EventBlock: React.FC<EventBlockProps> = ({ title, startMin, endMin, type, onClick }) => {
  const pixelPerMin = usePixelPerMin();
  
  const top = Math.max(0, (startMin - BASE_START_MIN) * pixelPerMin);
  const height = Math.max(18, (endMin - startMin) * pixelPerMin);

  return (
    <div 
      className={`event ${type}`} 
      style={{ top, height, position: 'absolute', width: '90%', left: '5%' }}
      onClick={onClick}
    >
      <span className="title">{title}</span>
      <div className="meta">{fmtHM(startMin)} - {fmtHM(endMin)}</div>
    </div>
  );
};
